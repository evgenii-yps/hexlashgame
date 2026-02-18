// Ammo.js (Bullet Physics) stub for local development
// Full Ammo.js WASM should be placed here for production
window.Ammo = window.Ammo || function() {
  return Promise.resolve({
    btVector3: function() {},
    btQuaternion: function() {},
    btDefaultCollisionConfiguration: function() {},
    btCollisionDispatcher: function() {},
    btDbvtBroadphase: function() {},
    btSequentialImpulseConstraintSolver: function() {},
    btDiscreteDynamicsWorld: function() {},
    destroy: function() {},
  });
};
console.log('[DEV] Ammo.js stub loaded');
