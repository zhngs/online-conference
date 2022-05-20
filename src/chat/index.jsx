import React, { useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import '../../style/chat.scss';

function ChatFeed(props) {
    const chat = useRef(null)

    const renderMessages = (messages) => {
        var message_nodes = messages.map((curr, index) => {
            if ((messages[index + 1] ? false : true) || messages[index + 1].id != curr.id) {
                return renderGroup(messages, index, curr.id)
            }
        })
        return message_nodes
    }

    const renderGroup = (messages, index, id) => {
        let group = []

        for (let i = index; messages[i] ? messages[i].id == id : false; i--) {
            group.push(messages[i])
        }

        var message_nodes = group.reverse().map((curr, index) => {
            return (
                <ChatBubble
                    key={Math.random().toString(36)}
                    message={curr}
                />
            )
        })

        return (
            <div key={Math.random().toString(36)} className='chatbubble-wrapper'>
                {message_nodes}
            </div>
        )
    }

    return (
        <div id="chat-panel" className='chat-panel'>
            <div className='title-panel'>
                <span className='title-chat'>Chat Room</span>
            </div>

            <div ref={chat} className='chat-history'>
                <div>
                {renderMessages(props.messages)}
                </div>
            </div>
            <ChatInput onSendMessage={props.onSendMessage} />
        </div>
    )
}

export default ChatFeed;