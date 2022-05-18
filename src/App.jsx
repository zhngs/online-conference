import { 
    Layout,
    Card,
    notification,
    Spin,
    Tooltip,
    Button
} from "antd";
import React, {useState, useEffect} from "react";
import LoginForm from './LoginForm';
import Conference from "./Conference";
import MediaSettings from "./MediaSettings";
import "../style/app.scss"
const { Header, Content, Footer, Sider } = Layout;

const notificationTip = (message, description) => {
    notification.info({
        message: message,
        description: description,
        placement: "bottomRight",
    });
};

function App() {

    const [login, setLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [vidFit, setVidFit] = useState(false);

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

    const handleJoin = async (values) => {
        console.log("handleJoin values: ", values);
        // setLogin(true);
        setLoading(true);
        // setSid(sid);
        // setUid(uid);
        // setLoginInfo(values);
        // setLocalVideoEnabled(!values.audioOnly);

        // conference.current.handleLocalStream(true);

        notificationTip(
            "Joined",
            "Welcome to the online conference room " + values.roomId
        );
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

    const onVidFitClickHandler = () => {
        setVidFit(!vidFit);
    };

    return (
        <Layout className="app-layout">
            <Header className="app-header">
                <MediaSettings onMediaSettingsChanged={onMediaSettingsChanged} settings={settings} />
            </Header>        
            <Content className="app-center-layout">
                {login ? (
                    <Layout className="app-right-layout">
                        <Content style={{ flex: 1 }}>
                            <Conference />
                        </Content>
                        <div className="app-fullscreen-layout">
                            <Tooltip title="Fit/Stretch Video">
                                <Button
                                    icon={vidFit ? "minus-square" : "plus-square"}
                                    size="large"
                                    shape="circle"
                                    onClick={() => onVidFitClickHandler()}
                                />
                            </Tooltip>
                            <Tooltip title="Fullscreen/Exit">
                                <Button
                                    icon={isFullScreen ? "fullscreen-exit" : "fullscreen"}
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
