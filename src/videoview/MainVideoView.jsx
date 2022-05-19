import React, { useEffect, useRef } from "react";
import { Avatar } from 'antd';
import "../../style/videoview.scss";

function MainVideoView(props) {

    const videoRef = useRef(null);

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

    useEffect(() => {
        videoRef.current.srcObject = props.stream;
        return () => {
            videoRef.current.srcObject = null;
        }
    },[])

    const { id, stream, muted } = props;

    return (
        <div className="main-video-layout">
            <video
                ref={videoRef}
                id={id}
                autoPlay
                playsInline
                muted={false}
                className="main-video-size"
            />
            <div className="main-video-name">
                <a className="main-video-name-a">{stream.info.name}</a>
            </div>
        </div>
    )
}

export default MainVideoView;