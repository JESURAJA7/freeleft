import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';


// Import route handlers
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import loadRoutes from './src/routes/loads.js';
import vehicleRoutes from './src/routes/vehicles.js';
import paymentRoutes from './src/routes/payments.js';
import podRoutes from './src/routes/pods.js';
import profileRoutes from './src/routes/profile.js';
import subscriptionRoutes from './src/routes/subscription.js';
import biddingRoutes from './src/routes/biddingRoutes.js';
import loadAssignmentRoutes from './src/routes/loadAssignmentRoutes.js';

dotenv.config();

// Connect to DB
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://xbow.netlify.app'], // React frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  },
});

// ✅ Socket.IO events
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join bidding room
  socket.on('join-bidding-room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 Socket ${socket.id} joined room ${roomId}`);
  });

  // Leave bidding room
  socket.on('leave-bidding-room', (roomId) => {
    socket.leave(roomId);
    console.log(`📤 Socket ${socket.id} left room ${roomId}`);
  });

  // Handle new bid
  socket.on('new-bid', (data) => {
    console.log('💰 New bid received:', data);
    // Broadcast to room
    io.to(data.roomId).emit('bid-updated', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'https://xbow.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));
app.options('*', cors());

// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pods', podRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/bidding', biddingRoutes);
app.use('/api/load-assignments', loadAssignmentRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'XBOW Logistics API is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// ✅ Start server with Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🩷 Server + Socket.IO running on http://localhost:${PORT}`);
});
