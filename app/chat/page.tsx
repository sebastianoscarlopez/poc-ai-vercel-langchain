'use client';

import { useChat } from 'ai/react';

const Chat = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col"
    >
      <div className="flex-grow bg-red-300 flex-auto">
        <ul className="list-none leading-10 overflow-auto h-[calc(100vh-200px)]">
          {messages.map((m, index) => (
            <li key={index}>
              <b className="font-bold">
                {m.role === 'user' ? 'You: ' : 'AI: '}
              </b>
              {m.content}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <div className="mt-4 flex flex-row">
            <textarea
              className="resize-none bg-gray-200 rounded-md p-2 w-full"
              placeholder="Pizza 🍕, beer 🍺, etc. $ 1234"
              rows={2}
              name="message"
              value={input}
              onChange={handleInputChange}
            />
            <button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
