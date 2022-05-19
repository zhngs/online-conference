import { 
    Layout,
    Card,
    notification,
    Spin,
    Tooltip,
    Button,
    Icon,
    Modal,
} from "antd";
import React, {useState, useEffect, useRef, forwardRef} from "react";
import LoginForm from './LoginForm';
import Conference from "./Conference";
import MediaSettings from "./MediaSettings";
import MicrophoneIcon from "mdi-react/MicrophoneIcon";
import MicrophoneOffIcon from "mdi-react/MicrophoneOffIcon";
import HangupIcon from "mdi-react/PhoneHangupIcon";
import TelevisionIcon from "mdi-react/TelevisionIcon";
import TelevisionOffIcon from "mdi-react/TelevisionOffIcon";
import VideoIcon from "mdi-react/VideoIcon";
import VideocamOffIcon from "mdi-react/VideocamOffIcon";
import { v4 as uuidv4 } from "uuid";
import * as Ion from "ion-sdk-js/lib/connector";
import "../style/app.scss"
const { Header, Content, Footer, Sider } = Layout;
const { confirm } = Modal;

const notificationTip = (message, description) => {
    notification.info({
        message: message,
        description: description,
        placement: "bottomRight",
    });
};

const ForwardRefConference = forwardRef(Conference);

function App() {
    const conference = useRef(null);

    const [login, setLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [sid, setSid] = useState('');
    const [uid, setUid] = useState(uuidv4());
    const [peers, setPeers] = useState([]);
    const [connector, setConnector] = useState(null);
    const [room, setRoom] = useState(null);
    const [rtc, setRTC] = useState(null);
    const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
    const [localVideoEnabled, setLocalVideoEnabled] = useState(true);

    let settings = {
        selectedAudioDevice: "",
        selectedVideoDevice: "",
        resolution: "vga",
        bandwidth: 512,
        codec: "vp8",
    };

    const onMediaSettingsChanged = (
        selectedAudioDevice,
        selectedVideoDevice,
        resolution,
        bandwidth,
        codec,
    ) => {
        settings = {
            selectedAudioDevice,
            selectedVideoDevice,
            resolution,
            bandwidth,
            codec,
        };
    };

    useEffect(() => {
        return () => {
            cleanUp();
        };
    }, []);

    const cleanUp = async () => {
        await conference.current.cleanUp();
        window.location.reload();
    };

    const handleJoin = async (values) => {
        console.log("handleJoin values: ", values);
        setLoading(true);

        let url = window.location.protocol + "//" + window.location.hostname + ":" + "5551";
        console.log("Connect url:" + url);
        let connector = new Ion.Connector(url, "token");
        setConnector(connector);
        let room = new Ion.Room(connector);
        let rtc = new Ion.RTC(connector);
        setRoom(room);
        setRTC(rtc);

        room.onjoin = (success, reason) => {
            console.log("onjoin: success=", success, ", reason=", reason);
            setLogin(true);
            setLoading(false);
            setLocalVideoEnabled(!values.audioOnly);
            conference.current.handleLocalStream(true);
            notificationTip(
                "Connected!",
                "Welcome to the ion room => " + values.roomId
            );
        };

        room.onleave = (reason) => {
            console.log("onleave: ", reason);
        };

        //通过该回调来维护peers列表
        room.onpeerevent = (ev) => {
            console.log("peerevent: ", ev);
            console.log( "[onpeerevent]: state = ", ev.state, ", peer = ", ev.peer.uid, ", name = ", ev.peer.displayname);

            if (ev.state == Ion.PeerState.JOIN) {
                notificationTip( "Peer Join", "peer => " + ev.peer.displayname+ ", join!");
            } else if (ev.state == Ion.PeerState.LEAVE) {
                notificationTip( "Peer Leave", "peer => " + ev.peer.displayname + ", leave!");
            }

            let peerInfo = {
                uid: ev.peer.uid,
                name: ev.peer.displayname,
                state: ev.state,
            };
            let _peers = peers;
            let find = false;
            _peers.forEach((item) => {
                if (item.uid == ev.peer.uid) {
                    item = peerInfo;
                    find = true;
                }
            });
            if (!find) {
                _peers.push(peerInfo);
            }
            console.log("setPeers peers= ", peers);
            setPeers([..._peers]);
        }

        const joininfo = {
          sid: values.roomId,
          uid: uid,
          displayname: values.displayName,
          extrainfo: "",
          destination: "webrtc://ion/peer1",
          role: Ion.Role.HOST,
          protocol: Ion.Protocol.WEBRTC,
          avatar: "string",
          direction: Ion.Direction.INCOMING,
          vendor: "string",
        }
        room.join(joininfo, "").then((result) => {
            console.log("join info: ", joininfo);
            console.log( "[join] result: success " + result?.success + ", room info: " + JSON.stringify(result?.room));
            if (!result?.success) {
                console.log("[join] failed: " + result?.reason);
                return
            }

            //将track的stream_id加入到peers里
            rtc.ontrackevent = function (ev) {
                console.log("ontrackevent: ", ev);
                console.log( "[ontrackevent]: \nuid = ", ev.uid, " \nstate = ", ev.state, ", \ntracks = ", JSON.stringify(ev.tracks));
                let _peers = peers;
                _peers.forEach((item) => {
                    ev.tracks.forEach((track) => {
                        if (item.uid == ev.uid && track.kind == "video") {
                            console.log("track=", track)
                            // item["id"] = JSON.stringify(ev.tracks)[0].id;
                            item["id"] = track.stream_id;
                            console.log("ev.streams[0].id:::" + item["id"]);
                        }
                    });
                });
                setPeers([..._peers]);
            }

            console.log("rtc.join")
            rtc.join(values.roomId, uid)
        });

    }

    const onFullScreenClickHandler = () => {
        let docElm = document.documentElement;

        const fullscreenState = () => {
            return (
                document.fullscreen ||
                document.webkitIsFullScreen ||
                document.mozFullScreen ||
                false
            );
        };

        if (fullscreenState()) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }

            setIsFullScreen(false);
        } else {
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            }
            //FireFox
            else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            }
            //Chrome
            else if (docElm.webkitRequestFullScreen) {
                docElm.webkitRequestFullScreen();
            }
            //IE11
            else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
            setIsFullScreen(true);
        }
    };

    const handleAudioTrackEnabled = (enabled) => {
        setLocalAudioEnabled(enabled);
        conference.current.muteMediaTrack("audio", enabled);
    };

    const handleVideoTrackEnabled = (enabled) => {
        setLocalVideoEnabled(enabled);
        conference.current.muteMediaTrack("video", enabled);
    };

    const handleLeave = async () => {
        confirm({
        title: "Leave Now?",
        content: "Do you want to leave the room?",
        async onOk() {
            await cleanUp();
            setLogin(false);
        },
        onCancel() {
            console.log("Cancel");
        },
        });
    };

    return (
        <Layout className="app-layout">
            <Header className="app-header">
                <div className="app-header-left"></div>
                {login ? (
                    <div className="app-header-tool">
                        <Tooltip title="Mute/Cancel">
                            <Button
                                ghost
                                size="large"
                                style={{ color: localAudioEnabled ? "" : "red" }}
                                type="link"
                                onClick={() => handleAudioTrackEnabled(!localAudioEnabled)}
                            >
                                <Icon
                                    component={
                                        localAudioEnabled ? MicrophoneIcon : MicrophoneOffIcon
                                    }
                                    style={{ display: "flex", justifyContent: "center" }}
                                />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Open/Close video">
                        <Button
                            ghost
                            size="large"
                            style={{ color: localVideoEnabled ? "" : "red" }}
                            type="link"
                            onClick={() => handleVideoTrackEnabled(!localVideoEnabled)}
                        >
                            <Icon
                                component={localVideoEnabled ? VideoIcon : VideocamOffIcon}
                                style={{ display: "flex", justifyContent: "center" }}
                            />
                        </Button>
                        </Tooltip>
                        <Tooltip title="Hangup">
                            <Button
                                shape="circle"
                                ghost
                                size="large"
                                type="danger"
                                style={{ marginLeft: 16, marginRight: 16 }}
                                onClick={handleLeave}
                            >
                                <Icon
                                    component={HangupIcon}
                                    style={{ display: "flex", justifyContent: "center" }}
                                />
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <div />
                )}
                <div className="app-header-right">
                    <MediaSettings onMediaSettingsChanged={onMediaSettingsChanged} settings={settings} />
                </div>
            </Header>        
            <Content className="app-center-layout">
                {login ? (
                    <Layout className="app-right-layout">
                        <Content style={{ flex: 1 }}>
                            <ForwardRefConference 
                                ref={conference}
                                uid={uid}
                                rtc={rtc}
                                settings={settings}
                                peers={peers}
                            />
                        </Content>
                        <div className="app-fullscreen-layout">
                            <Tooltip title="Fullscreen/Exit">
                                <Button
                                    icon={isFullScreen ? "fullscreen-exit" : "fullscreen"}
                                    ghost
                                    size="large"
                                    shape="circle"
                                    className="app-fullscreen-button"
                                    onClick={() => onFullScreenClickHandler()}
                                />
                            </Tooltip>
                        </div>
                    </Layout>
                ) : loading ? (
                    <Spin size="large" tip="Joining..." />
                ) : (
                    <Card title="Join the Conference" className="app-login-card">
                        <LoginForm handleLogin={handleJoin} />
                    </Card>
                )}
            </Content>
        </Layout>
    )
}

export default App;
