# gestureboard

# Link: https://gestureboard.pages.dev/
# Temp link:  https://23b7-2c0f-fe38-2283-7c64-475c-a61e-fdb3-aebf.ngrok-free.app/

# Current Feature being implemented 
Enable real-time multi-user collaboration so multiple browsers can share and edit the same canvas simultaneously.
Provide a simple, self-hosted sync layer and client hooks so drawing state and toolbar options remain consistent across connected users.
Description
Add a lightweight Node server server.js that serves static assets and hosts a WebSocket endpoint which keeps an in-memory sharedState and broadcasts updates to connected clients.
Add js/collab.js implementing CollabMgr to manage socket lifecycle, reconnects, initial sync requests, and deduplicated publishState messaging.
Wire collaboration into the app in js/app.js by creating a CollabMgr instance, subscribing to drawing.onStateChange, applying remote state via collab.onState while avoiding rebroadcast loops with an applyingRemoteState flag, and syncing toolbar UI with syncToolbarState.
Extend js/drawing.js with onStateChange, exportState, importState, and _emitStateChange and call _emitStateChange from finalizeDraft, undo, and eraseAll to notify the collab layer of finalized changes.
Include js/collab.js in index.html, add package.json with a start script and ws dependency, and update README.md with run and collaboration notes.
Testing
Ran node --check server.js, node --check js/app.js, node --check js/drawing.js, and node --check js/collab.js, and all checks succeeded.
Attempted npm install to fetch the ws dependency but it failed in this environment with an npm registry 403 Forbidden error, so full runtime dependency install was not completed.
