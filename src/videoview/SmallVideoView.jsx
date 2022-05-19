import React, { useEffect, useRef } from "react";
import "../../style/videoview.scss";

function SmallVideoView(props) {
    const videoRef = useRef(null)

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
    }, [])

    const { id, stream } = props;

    return (
        <div className="small-video-div">
            <video
                ref={videoRef}
                id={id}
                autoPlay
                playsInline
                muted={false}
                className="small-video-size"
            />
            <div className="small-video-id-div">
                <a className="small-video-id-a">{stream.info.name}</a>
            </div>
        </div>
    )
}

export default SmallVideoView;