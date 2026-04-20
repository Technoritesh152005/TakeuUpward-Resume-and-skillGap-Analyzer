const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
export { asyncHandler };


// 🧠 What problem it solves

// In Express, this doesn’t work properly:

// app.get('/user', async (req, res) => {
//   throw new Error("Error")
// });

// 👉 Error may crash app or not reach error middleware ❌

// ✅ Your code
// const asyncHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };
// 🔍 What it means step-by-step
// 1️⃣ It takes a function
// asyncHandler(fn)

// 👉 fn = your async controller

// 2️⃣ Returns a new function
// (req, res, next) => { ... }

// 👉 Express will call this

// 3️⃣ Wraps your function in Promise
// Promise.resolve(fn(req, res, next))

// 👉 Handles both:

// async functions
// normal functions
// 4️⃣ Catches errors
// .catch(next)

// 👉 Sends error to Express error middleware