import React, { useEffect, useRef, useState } from "react";
import { Avatar, Button } from 'antd';
import MicrophoneOffIcon from "mdi-react/MicrophoneOffIcon";
import VideocamOffIcon from "mdi-react/VideocamOffIcon";
import PictureInPictureBottomRightOutlineIcon from "mdi-react/PictureInPictureBottomRightOutlineIcon";
import "../../style/videoview.scss"

//本身是一个vedio标签，通过props中的stream来显示视频
function LocalVideoView(props) {
    const videoRef = useRef(null)
    const [minimize, setMinimize] = useState(false);
    const { id, label, audioMuted, videoMuted, videoType } = props;

    useEffect(() => {
        videoRef.current.srcObject = props.stream;
        return () => {
        videoRef.current.srcObject = null;
        }
    },[])

    const onMinimizeClick = () => {
        setMinimize(!minimize);
    }

    //测试的时候使用
    // useEffect(()=>{
    //     const constraints = { audio: false, video: true };
    //     navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
    //         videoRef.current.srcObject = stream;
    //     })
    //     return ()=>{
    //         videoRef.current.srcObject = null;
    //     }
    // }, [])

    return (
        <div className="local-video-container" style={{ borderWidth: `${minimize ? '0px' : '0.5px'}` }}>
            <video
                ref={videoRef}
                id={id}
                autoPlay
                playsInline
                muted={true}
                className="local-video-size"
                style={{ display: `${minimize ? 'none' : ''}` }}
            />
            <div className="local-video-icon-layout" >
                <Button
                    ghost
                    size="small"
                    type="link"
                    onClick={() => onMinimizeClick()}
                >
                    <PictureInPictureBottomRightOutlineIcon size={18} />
                </Button>
                {!minimize && audioMuted && <MicrophoneOffIcon size={18} color="white" />}
                {!minimize && videoMuted && <VideocamOffIcon size={18} color="white" />}
            </div>
            <a className="local-video-name" style={{ display: `${minimize ? 'none' : ''}` }}>{label}</a>
        </div>
    )
}

export default LocalVideoView;