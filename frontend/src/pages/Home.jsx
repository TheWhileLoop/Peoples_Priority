import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Camera, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Apni Awaaz, <span className="text-blue-600">Apne Neta Tak</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Report civic issues instantly using Voice, Photo, or Text. AI analyzes your complaint and prioritizes it for your MP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mic className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Speak (Voice)</h3>
          <p className="mt-2 text-sm text-gray-500 mb-4">Boliye, aapki kya samasya hai? Describe in your own language.</p>
          <button className="mt-auto w-full bg-gray-50 hover:bg-gray-100 text-blue-600 font-semibold py-2 px-4 border border-gray-200 rounded-lg">
            Record Audio
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Camera className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Snap (Photo)</h3>
          <p className="mt-2 text-sm text-gray-500 mb-4">Upload a photo of the problem. AI will automatically verify it.</p>
          <button className="mt-auto w-full bg-gray-50 hover:bg-gray-100 text-green-600 font-semibold py-2 px-4 border border-gray-200 rounded-lg">
            Take Photo
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="h-14 w-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Type (Text)</h3>
          <p className="mt-2 text-sm text-gray-500 mb-4">Prefer typing? Write a quick description of the issue.</p>
          <button className="mt-auto w-full bg-gray-50 hover:bg-gray-100 text-purple-600 font-semibold py-2 px-4 border border-gray-200 rounded-lg">
            Write Text
          </button>
        </div>
      </div>
      
    </div>
  );
}
