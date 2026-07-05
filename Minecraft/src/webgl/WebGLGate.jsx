import { isWebGLAvailable } from './checkWebGL.js'

export default function WebGLGate({ children }) {
  if (!isWebGLAvailable()) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <p className="text-center px-4">
          このブラウザは3D表示(WebGL)に対応していません。<br />
          最新のChrome、Firefox、Safariでお試しください。
        </p>
      </div>
    )
  }
  return children
}
