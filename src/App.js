import React, {useState, useEffect, useRef} from "react";
import socketIOClient from "socket.io-client";
import './App.css';
import logo from './logo.svg';
import {initFlowbite} from 'flowbite';
import moment from "moment";

const host = "https://chat-be-production.up.railway.app";

function App() {
    const [mess, setMess] = useState([]);
    const [message, setMessage] = useState('');
    const [id, setId] = useState();
    const [email, setEmail] = useState();
    const [conversations, setConversations] = useState([
        {
            members: [],
            last_message: {
                sender: "",
                content: "",
                send_time: -1
            },
        }
    ]);
    const [currentConversation, setCurrentConversation] = useState('')

    const socketRef = useRef();

    useEffect(() => {
        initFlowbite();
    }, []);

    useEffect(() => {
        if (email) {
            socketRef.current = socketIOClient.connect(host)
            socketRef.current.emit('init', email)

            socketRef.current.on('init', data => {
                if (!data.length) return

                setConversations(data)
            })

            socketRef.current.on('receive', dataGot => {
                setConversations(conversations => {
                    const conversationId = dataGot.conversationId
                    const conversation = conversations.find(conversation => conversation._id === conversationId)
                    conversation.last_message = dataGot
                    return conversations
                })
                setMess(messes => [...messes, dataGot])
            })

            return () => {
                socketRef.current.disconnect();
            };
        }
    }, [email])

    useEffect(() => {
        if (conversations.length === 0) return
        const conversationId = conversations[0]._id

        if (!conversationId) return
        setCurrentConversation(conversationId)

    }, [conversations])

    useEffect(() => {
        if (!currentConversation) return

        fetch('https://chat-be-production.up.railway.app/' + currentConversation)
            .then(res => res.json())
            .then(data => {
                setMess([...data.messages])
            })
    }, [currentConversation]);

    const sendMessage = () => {
        if (message.trim()) {
            const msg = {
                conversation_id: currentConversation,
                sender: email,
                content: message,
                send_time: new Date().valueOf()
            }
            socketRef.current.emit('send', msg)

            setMessage('')
        }
    }

    const renderMessages = () => {
        return mess.map((msg, index) => {
            if (msg.sender === email) {
                return (
                    <div className='w-full text-end' key={index}>
                        <div
                            className='inline-block bg-blue-600 text-white max-w-[60%] w-auto p-2 rounded-xl break-words'>{msg.content}
                        </div>
                    </div>
                )
            }

            return (
                <div className='w-full' key={index}>
                    <div
                        className='inline-block bg-gray-200 max-w-[60%] w-auto p-2 rounded-xl break-words'>{msg.content}
                    </div>
                </div>
            )
        })
    }

    const renderConversations = () => {
        return conversations.map((conversation, index) => {
            return <div className={`flex items-center hover:bg-gray-100 cursor-pointer ${conversation._id == currentConversation ? 'bg-gray-100': ''}`} key={index} onClick={() => setCurrentConversation(conversation._id)}>
                <div className='w-[56px]'>
                    <img src={logo} alt='User Avatar' className='w-full aspect-square rounded-full'/>
                </div>
                <div className='flex-1'>
                    <div className='font-semibold'>{conversation.members.find(member => member !== email)}</div>
                    <div className='text-sm text-gray-500 flex items-center'>
                        <div className='overflow-hidden w-[60%] whitespace-nowrap text-ellipsis mr-4'>
                            {`${conversation.last_message.sender === email ? 'You: ' : ''}${conversation.last_message.content}`}
                        </div>
                        <div className='basis-[40%]'>{moment(conversation.last_message.send_time).format('LT')}</div>
                    </div>
                </div>
            </div>
        })
    }

    const loginRender = () => {
        return (
            <div className="container w-[1200px] mx-auto h-screen overflow-y-hidden flex justify-center items-center">
                <div className='w-[400px]'>
                    <div className='text-center text-2xl font-semibold mb-4'>Login</div>
                    <div className='mb-4'>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <div className="mt-1 flex space-x-2">
                            <input type="email" name="email" id="email"
                                   className="block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                                   placeholder=""/>
                            <button type="button" onClick={() => setEmail(document.getElementById('email').value)}
                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm py-2 px-4">Start
                            </button>
                        </div>
                    </div>
                </div>
            </div>)
    }

    if (!email) return loginRender()

    return (
        <div className="container w-[1200px] mx-auto h-screen overflow-y-hidden flex justify-between items-center">
            {/*List conversations:*/}
            <div className='basis-[30%] h-[95%] py-2'>
                {/*Search Bar*/}
                <div className='mb-2 mx-2'>
                    <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                                      strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                        </div>
                        <input type="search" id="default-search"
                               className="block w-full p-3 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Search" required/>
                    </div>
                </div>

                <div>
                    {renderConversations()}
                </div>
            </div>

            {/*Chat box*/}
            <div className='basis-[70%] h-[95%] py-2 border-l border-gray-200'>
                <div className='border-b border-gray-200 h-[8%] flex items-center'>
                    <img src={logo} alt='User Avatar' className='w-[56px] aspect-square rounded-full'/>
                    <div className='font-semibold'>{conversations.find(conversation => conversation._id === currentConversation).members.find(member => member !== email)}</div>
                </div>
                <div className='h-[92%]'>
                    <div className='h-[93%] p-3 space-y-2 overflow-y-scroll flex flex-col justify-end'>
                        {renderMessages()}
                    </div>
                    <div className='flex justify-evenly items-center h-[7%]'>
                        <div className="w-[80%]">
                            <input type="search" id="default-search" value={message}
                                   onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                   onChange={e => setMessage(e.target.value)}
                                   className="block w-full py-2 px-4 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Type a message..." required/>
                        </div>
                        <button type="button" onClick={sendMessage}
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm py-2 px-4">Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;