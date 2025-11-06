import React from 'react';

interface WebGLPreviewProps {
  htmlContent: string | null;
  isLoading: boolean;
}

const WebGLPreview: React.FC<WebGLPreviewProps> = ({ htmlContent, isLoading }) => {
  const Placeholder = ({ message, subtext }: { message: string, subtext: string }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-center p-4">
      <div className="max-w-md">
        <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104l-2.28 2.28-1.591 1.59-4.5 4.5 2.28 2.28 6.09-6.09 2.28-2.28-2.28-2.28zm5.509 0l-2.28 2.28 6.09 6.09 2.28-2.28-4.5-4.5-1.591-1.59zM12 15.75l-6.09 6.09 2.28 2.28 6.09-6.09-2.28-2.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3.75l6.09 6.09-2.28 2.28-6.09-6.09 2.28-2.28z"/>
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-gray-300">{message}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtext}</p>
      </div>
    </div>
  );

  const Loader = () => (
     <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-center p-4">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-gray-300">Unpacking Project...</h2>
        <p className="mt-1 text-sm text-gray-500">Please wait while we process your .zip file.</p>
     </div>
  );

  if (isLoading) {
    return <Loader />;
  }

  if (!htmlContent) {
    return <Placeholder message="Preview Area" subtext="Upload a .zip file of your game to see it here." />;
  }
  
  // This script is injected into the iframe to intercept file requests.
  const interceptorScript = `
    const requests = new Map();
    let requestIdCounter = 0;

    // Listen for file content responses from the parent window
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FILE_CONTENT') {
            const { requestId, success, content, error, contentType } = event.data;
            const callbacks = requests.get(requestId);
            if (callbacks) {
                requests.delete(requestId);
                if (success) {
                    const blob = new Blob([content], { type: contentType });
                    const response = new Response(blob, { status: 200, statusText: 'OK' });
                    callbacks.resolve(response);
                } else {
                    callbacks.reject(new Error(error));
                }
            }
        }
    });

    // Function to request a file from the parent window
    function requestFileFromHost(path) {
        return new Promise((resolve, reject) => {
            const requestId = requestIdCounter++;
            requests.set(requestId, { resolve, reject });
            // The third argument '*' is a security risk in production, but necessary
            // in sandboxed environments with null origins.
            window.parent.postMessage({ type: 'GET_FILE', path, requestId }, '*');
        });
    }

    // --- Fetch Interceptor ---
    const originalFetch = window.fetch;
    window.fetch = (input, init) => {
        if (typeof input === 'string') {
            try {
                // An absolute URL will parse correctly. A relative URL will throw.
                new URL(input);
                return originalFetch(input, init); // It's absolute, let it go through
            } catch (e) {
                // It's a relative path, intercept it
                return requestFileFromHost(input);
            }
        }
        // Pass through non-string requests (e.g., Request objects)
        return originalFetch(input, init);
    };

    // --- XHR Interceptor ---
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._interceptedUrl = url;
        this._openArgs = [method, url, ...args];
    };
    
    XMLHttpRequest.prototype.send = function(body) {
        if (this._interceptedUrl) {
            try {
                new URL(this._interceptedUrl, window.location.origin);
                 // It's an absolute URL, use original behavior
                originalXhrOpen.apply(this, this._openArgs);
                originalXhrSend.apply(this, [body]);
            } catch (e) {
                // It's a relative URL, intercept it
                const xhr = this;
                requestFileFromHost(this._interceptedUrl)
                    .then(response => response.blob())
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        originalXhrOpen.apply(xhr, [this._openArgs[0], blobUrl, ...this._openArgs.slice(2)]);
                        originalXhrSend.apply(xhr, [body]);
                        xhr.addEventListener('loadend', () => URL.revokeObjectURL(blobUrl), { once: true });
                    })
                    .catch(err => {
                        this.dispatchEvent(new ProgressEvent('error'));
                    });
            }
        } else {
            // Should not happen if open was called
            originalXhrSend.apply(this, [body]);
        }
    };
  `;

  // Inject the interceptor script into the head of the HTML content
  const headEndIndex = htmlContent.toLowerCase().indexOf('</head>');
  let finalHtml;
  if (headEndIndex !== -1) {
    finalHtml = `${htmlContent.slice(0, headEndIndex)}<script>${interceptorScript}</script>${htmlContent.slice(headEndIndex)}`;
  } else {
    // Fallback if no </head> is found
    finalHtml = `<script>${interceptorScript}</script>${htmlContent}`;
  }

  return (
    <iframe
      srcDoc={finalHtml}
      title="WebGL Preview"
      className="w-full h-full border-0"
      sandbox="allow-scripts"
    ></iframe>
  );
};

export default WebGLPreview;
