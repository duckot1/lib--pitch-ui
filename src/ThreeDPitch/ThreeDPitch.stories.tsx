// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import { ThreeDPitch } from './ThreeDPitch';
import { PacketBuffer } from '../Strack/buffer'

export default {
    title: "PitchWrapper",
    component: ThreeDPitch
};

const defaultProtocol = "http://",
      defaultURL = `127.0.0.1`,
      defaultPort = '8888'

export const Standard = () => {

  const [pitchReady, setPitchReady] = useState(false)
  const [packetBuffer, setPacketBuffer] = useState(null)

  const [socket, setSocket] = useState(null)
  const [socketActions, setSocketActions] = useState([])
  const [protocol, setProtocol] = useState(defaultProtocol)
  const [host, setHost] = useState(defaultURL)
  const [port, setPort] = useState(defaultPort)


  useEffect(() => {
    // Create new websocket
    let newSocket = new WebSocket(`${protocol}${host}${port}/ws/raw`)
    newSocket.onopen = (evt) => {
      console.log(`websocket connection opened`)
    }
    newSocket.onerror = (evt) => {
      console.log(`websocket connection error`)
      console.log(evt)
    }
    setSocket(newSocket)

    return () => {
      if (packetBuffer) {
        packetBuffer.stopBuffer()
      }
    }
  }, [])

  useEffect(() => {
    socket.onmessage = (evt) => {
      let data = JSON.parse(evt.data)
      socketActions.forEach(action => {
        action(data)
      })
    }
  }, [socketActions])

  useEffect(() => {
    console.log('pitch ready')
    let packetBuffer = new PacketBuffer({}, {})
    let rawAction = (data) => {
      packetBuffer.updateBuffer(data)
    }

    setPacketBuffer(packetBuffer)

    setSocketActions({
      ...socketActions,
      raw: rawAction
    })

  }, [pitchReady])

  return (
    <ThreeDPitch
    />
  );
}

Standard.storyName = '3D Pitch';

