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
import ChatFeed from "./chat";
import Message from "./chat/Message";
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

    const [collapsed, setCollapsed] = useState(true);
    const [login, setLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [loginInfo, setLoginInfo] = useState({});
    const [sid, setSid] = useState('');
    const [uid, setUid] = useState(uuidv4());
    const [messages, setMessages] = useState([]);
    const [peers, setPeers] = useState([]);
    const [connector, setConnector] = useState(null);
    const [room, setRoom] = useState(null);
    const [rtc, setRTC] = useState(null);
    const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
    const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
    const [screenSharingEnabled, setScreenSharingEnabled] = useState(false);

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
        setLoginInfo(values);

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
                onSystemMessage(ev.peer.displayname + ", join!");
            } else if (ev.state == Ion.PeerState.LEAVE) {
                notificationTip( "Peer Leave", "peer => " + ev.peer.displayname + ", leave!");
                onSystemMessage(ev.peer.displayname + ", leave!");
            }

            setPeers(peers=>{
                let peerInfo = {
                    uid: ev.peer.uid,
                    name: ev.peer.displayname,
                    state: ev.state,
                };
                let find = false;
                peers.forEach((item) => {
                    if (item.uid == ev.peer.uid) {
                        item = peerInfo;
                        find = true;
                    }
                });
                if (!find) {
                    peers.push(peerInfo);
                }
                let res = [...peers]
                console.log("setPeers peers= ", res);
                return res;
            });
        }

        room.onmessage = (msg) => {
            const uint8Arr = new Uint8Array(msg.data);
            const decodedString = String.fromCharCode.apply(null, uint8Arr);
            const json  = JSON.parse(decodedString);
            console.log("onmessage msg= ", msg, "json= ", json);
            setMessages(messages=>{
                if (uid != msg.from) {
                    let _uid = 1;
                    messages.push(
                        new Message({
                            id: _uid,
                            message: json.msg.text,
                            senderName: json.msg.name,
                        })
                    );
                }
                let res = [...messages];
                console.log("setMessages msg= ", res);
                return res;
            });
        };

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
                setPeers(peers=>{
                    peers.forEach((item) => {
                        ev.tracks.forEach((track) => {
                            if (item.uid == ev.uid && track.kind == "video") {
                                console.log("track=", track)
                                // item["id"] = JSON.stringify(ev.tracks)[0].id;
                                item["id"] = track.stream_id;
                                console.log("ev.streams[0].id:::" + item["id"]);
                            }
                        });
                    });
                    let res = [...peers];
                    return res;
                })
            }

            rtc.ondatachannel = ({ channel }) => {
                console.log("[ondatachannel] channel=", channel);
                channel.onmessage = ({ data }) => {
                    console.log("[ondatachannel] channel onmessage =", data);
                };
            };

            console.log("rtc.join")
            rtc.join(values.roomId, uid)
        });

    }

    const onSendMessage = (msg) => {
        console.log("broadcast to room: ", loginInfo.roomId, " message: " + msg);

        var data = {
            uid: uid,
            name: loginInfo.displayName,
            text: msg,
        };
        let map = new Map();
        map.set('msg', data);
        room.message(loginInfo.roomId, uid, "all", 'Map', map);

        setMessages(messages=>{
            let _uid = 0;
            messages.push(
                new Message({
                    id: _uid,
                    message: msg,
                    senderName: "me",
                })
            );
            let res = [...messages];
            console.log("on send messages: ", res);
            return res;
        });
    };

    const onSystemMessage = (msg) => {
        setMessages(messages=>{
            let _uid = 2;
            messages.push(
                new Message({
                    id: _uid,
                    message: msg,
                    senderName: "System",
                })
            );
            let res = [...messages];
            console.log("on system messages: ", res);
            return res;
        });
    };

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

    const handleScreenSharing = (enabled) => {
        setScreenSharingEnabled(enabled);
        conference.current.handleScreenSharing(enabled);
    };

    const openOrCloseLeftContainer = (collapsed) => {
        setCollapsed(collapsed);
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
                <div className="app-header-left">
                    <MediaSettings onMediaSettingsChanged={onMediaSettingsChanged} settings={settings} />
                </div>
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
                        <Tooltip title="Share desktop">
                            <Button
                                ghost
                                size="large"
                                type="link"
                                style={{ color: screenSharingEnabled ? "red" : "" }}
                                onClick={() => handleScreenSharing(!screenSharingEnabled)}
                            >
                                <Icon
                                    component={ screenSharingEnabled ? TelevisionOffIcon : TelevisionIcon }
                                    style={{ display: "flex", justifyContent: "center" }}
                                />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Hangup">
                            <Button
                                ghost
                                size="large"
                                type="link"
                                style={{ color: "red" }}
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
            </Header>        
            <Content className="app-center-layout">
                {login ? (
                    <Layout className="app-content-layout">
                        <Sider
                            width={320}
                            style={{ background: "#333" }}
                            collapsedWidth={0}
                            trigger={null}
                            collapsible
                            collapsed={collapsed}
                        >
                            <div className="left-container">
                                <ChatFeed messages={messages} onSendMessage={onSendMessage} />
                            </div>
                        </Sider>
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
                            <div className="app-collapsed-button">
                                <Tooltip title="Open/Close chat panel">
                                <Button
                                    icon={collapsed ? "right" : "left"}
                                    size="large"
                                    shape="circle"
                                    ghost
                                    onClick={() => openOrCloseLeftContainer(!collapsed)}
                                />
                                </Tooltip>
                            </div>
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
