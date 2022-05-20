import React, { useState, useImperativeHandle } from "react";
import { Spin, notification, Layout } from "antd";
import { LocalVideoView, MainVideoView, SmallVideoView } from "./videoview";
import "../style/conference.scss";
import * as Ion from "ion-sdk-js/lib/connector";


function Conference(props, ref) {

    const [streams, setStreams] = useState([])
    const [localStreamObj, setLocalStreamObj] = useState({stream:null})
    const [localScreenObj, setLocalScreenObj] = useState({stream:null})
    const [audioMuted, setAudioMuted] = useState(false)
    const [videoMuted, setVideoMuted] = useState(false)

    useImperativeHandle(
        ref,
        () => ({
            handleLocalStream(enabled) {
                doHandleLocalStream(enabled)
            },
            handleScreenSharing(enabled) {
                doHandleScreenSharing(enabled)
            },
            muteMediaTrack(type, enabled) {
                doMuteMediaTrack(type, enabled)
            },
            cleanUp(){
                doCleanUp()
            }
        }),
        []
    );

    const doCleanUp = async () => {
        console.log("doCleanUp localStreamObj=", localStreamObj, ", localScreenObj=", localScreenObj)
        if (localStreamObj && localStreamObj.stream) {
            await unpublish(localStreamObj.stream)
            localStreamObj.stream = null
            setLocalStreamObj(localStreamObj)
        }
    
        if (localScreenObj && localScreenObj.stream) {
            await unpublish(localScreenObj.stream)
            localScreenObj.stream = null
            setLocalScreenObj(localScreenObj)
        }
    
        console.log("doCleanUp streams=", streams)
        streams.map(async item => {
        // await item.stream.unsubscribe();
        });
        setStreams([])
    };

    const updateMuteStatus = (stream, muted) => {
        console.log("updateMuteStatus stream=", stream, ", muted=", muted);
        setStreams((p)=>{
            return p.map(item=>{
                if (item.id == stream.id) {
                    item.muted = muted;
                }
                return item
            })
        })
    }

    const doHandleScreenSharing = async (enabled) => {
        const {settings, rtc } = props;
        if (enabled) {
            let _stream = await Ion.LocalStream.getDisplayMedia({
                codec: settings.codec.toUpperCase(),
                resolution: settings.resolution,
                bandwidth: settings.bandwidth,
            })

            setLocalScreenObj({stream: _stream});
            await rtc.publish(_stream);
            let track = _stream.getVideoTracks()[0];
            if (track) {
                track.addEventListener("ended", () => {
                    // screenSharingClick(false);
                    doHandleScreenSharing(false);
                });
            }
        } else {
            if (localScreenObj.stream) {
                unpublish(localScreenObj.stream);
                localScreenObj.stream = null
                setLocalScreenObj({stream:null})
            }
        }
    };

    //别的用户加入时会触发回调，在回调中可以拿到其他用户的stream和track，利用stream创建一个item加入到streams里
    //通过peers中item的id和stream的id对比，将peers中item的name赋值给stream.info.name，显示在视频窗口上
    const doHandleLocalStream = async (enabled) => {
        const { settings, rtc, peers } = props;
        let _streams = JSON.parse(JSON.stringify(streams));
        rtc.ontrack = (track, stream) => {
            console.log("got track", track.id, "for stream", stream.id);
            console.log("track: ", track);
            console.log("stream: ", stream);
            if (track.kind === "video") {
                track.onunmute = () => {
                    let found = false
                    _streams.forEach(item => {
                        if (stream.id === item.id) {
                            found = true
                        }
                    })

                    if (!found) {
                        setTimeout(() => {
                            console.log("stream.id: " + stream.id);
                            let name = 'Guest';
                            console.log("peers=", peers, "stream=", stream);
                            peers.forEach((item) => {
                                if (item["id"] == stream.id) {
                                    name = item.name;
                                }
                            });
                            console.log("stream name: ", name)

                            stream.info = { 'name': name };
                            _streams.push({ id: stream.id, stream });
                            setStreams([..._streams])

                            stream.onremovetrack = () => {
                                _streams = _streams.filter(item => item.id !== stream.id);
                                setStreams([..._streams])
                            };
                        }, 200);
                    }
                    updateMuteStatus(stream, false);
                };

                track.onmute = () => {
                    console.log("onmute:::" + stream.id);
                    updateMuteStatus(stream, true);
                }
            }
        }
        if (enabled) {
            Ion.LocalStream.getUserMedia({
                codec: settings.codec.toUpperCase(),
                resolution: settings.resolution,
                bandwidth: settings.bandwidth,
                audio: true,
                video: true,
            }).then((media) => {
                console.log("rtc.publish media=", media)
                rtc.publish(media)
                localStreamObj.stream = media
                setLocalStreamObj(localStreamObj)
            }).catch((e) => {
                console.log("handleLocalStream error => " + e);
            });
        } else {
            if (localStreamObj.stream) {
                unpublish(localStreamObj.stream, rtc);
                localStreamObj.stream = null;
                setLocalStreamObj(localStreamObj)
            }
        }
        doMuteMediaTrack("video", props.localVideoEnabled);
    }

    const doMuteMediaTrack = (type, enabled) => {
        if (!localStreamObj.stream) {
            return
        }
        if (enabled) {
            localStreamObj.stream.unmute(type)
        } else {
            localStreamObj.stream.mute(type)
        }

        if (type === "audio") {
            setAudioMuted(!enabled)
        } else if (type === "video") {
            setVideoMuted(!enabled)
        }
    };

    const unpublish = async (stream)=> {
        console.log("stream.unpublish stream=", stream);
        if (stream) {
        await stopMediaStream(stream);
        }
    };

    const stopMediaStream = async (stream) => {
        console.log("stopMediaStream stream=", stream);
        let tracks = stream.getTracks();
        for (let i = 0, len = tracks.length; i < len; i++) {
            await tracks[i].stop();
            console.log("stopMediaStream track=", tracks[i]);
        }
    };

    const id = props.uid;

    return (
        <div className="conference-layout">

            {streams.length === 0 && (
                <div className="conference-layout-wating">
                    <Spin size="large" tip="Wait for other people joining ..." />
                </div>
            )}

            {streams.map((item, index) => {
                return index == 0 ? (
                    <MainVideoView key={item.id} id={item.id} stream={item.stream} muted={item.muted} />
                ) : (
                ""
                );
            })}

            {localStreamObj.stream && (
                <div className="conference-local-video-layout">
                <LocalVideoView
                    key={id + "-video"}
                    id={id + "-video"}
                    label="Local Stream"
                    stream={localStreamObj.stream}
                    audioMuted={audioMuted}
                    videoMuted={videoMuted}
                    videoType="localVideo"
                />
                </div>
            )}

            {localScreenObj.stream && (
                <div className="conference-local-screen-layout">
                    <LocalVideoView
                        key={id + "-screen"}
                        id={id + "-screen"}
                        label="Screen Sharing"
                        stream={localScreenObj.stream}
                        audioMuted={false}
                        videoMuted={false}
                        videoType="localScreen"
                    />
                </div>
            )}

            <div className="small-video-list-div">
                <div className="small-video-list">
                    {streams.map((item, index) => {
                        return index > 0 ? (
                            <SmallVideoView
                                key={item.id}
                                id={item.id}
                                stream={item.stream}
                                index={index}
                                // onClick={onChangeVideoPosition}
                            />
                        ) : (
                            ""
                        )
                    })}
                </div>
            </div>

        </div>
    )
}

export default Conference;