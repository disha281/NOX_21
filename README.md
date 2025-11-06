# NOX_21

# MedAI - Smart Medicine Locator and Price Optimizer

🏥 *AI-Powered Smart Medicine Locator* with real-time price comparison, pharmacy recommendations, and prescription OCR capabilities.

## 🌟 Features

### Core Functionality
- *🔍 Smart Medicine Search*: Find medicines by name with fuzzy matching
- *📱 OCR Prescription Upload*: AI-powered prescription image processing
- *📍 Location-Based Search*: Find nearby pharmacies with GPS integration
- *💰 Real-Time Price Comparison*: Compare prices across multiple pharmacies
- *🤖 AI Recommendations*: Smart pharmacy suggestions based on price, distance, and availability
- *💊 Substitute Finder*: Find generic alternatives and therapeutic substitutes
- *📊 Analytics Dashboard*: Real-time insights and trends

### Advanced Features
- *🗺 Interactive Maps*: Visual pharmacy locations with detailed information
- *📈 Price Trend Analysis*: Historical price data and forecasting
- *⚡ Emergency Mode*: Prioritize distance for urgent medicine needs
- *🔒 Privacy-First*: Anonymized data processing and secure handling
- *📱 Responsive Design*: Works seamlessly on desktop and mobile devices

## 🏗 System Architecture


┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   Data Layer    │
│                 │    │                 │    │                 │
│ • Search UI     │◄──►│ • Medicine API  │◄──►│ • Medicine DB   │
│ • Map View      │    │ • Pharmacy API  │    │ • Pharmacy DB   │
│ • OCR Upload    │    │ • OCR Service   │    │ • Price History │
│ • Price Compare │    │ • AI Engine     │    │ • User Prefs    │
│ • Dashboard     │    │ • Recommendations│   │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘


## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with location services

### Installation

1. *Clone the repository*
   bash
   git clone <repository-url>
   cd medai-smart-medicine-locator
   

2. *Install dependencies*
   bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   

3. *Environment Setup*
   bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configuration
   

4. *Start the application*
   bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or run separately:
   # Server: npm run server
   # Client: npm run client
   

5. *Access the application*
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📖 API Documentation

### Medicine Endpoints

GET  /api/medicine/search?query={name}     # Search medicines
GET  /api/medicine/{id}                    # Get medicine details
GET  /api/medicine/{id}/substitutes        # Find substitutes
GET  /api/medicine/popular/list            # Popular medicines


### Pharmacy Endpoints

GET  /api/pharmacy/nearby                  # Find nearby pharmacies
GET  /api/pharmacy/{id}                    # Pharmacy details
GET  /api/pharmacy/compare/{medicineId}    # Price comparison


### OCR Endpoints

POST /api/ocr/prescription                 # Process prescription image
POST /api/ocr/medicine-name               # Extract medicine name
GET  /api/ocr/health                      # OCR service status


### Recommendation Endpoints

POST /api/recommendation/pharmacy          # Get AI recommendations
POST /api/recommendation/best-pharmacy     # Best pharmacy suggestion
GET  /api/recommendation/price-trend/{id}  # Price trend analysis


## 🧠 AI & Machine Learning Components

### 1. OCR Engine
- *Technology*: Tesseract.js / Google Vision API
- *Capabilities*: 
  - Prescription text extraction
  - Medicine name recognition
  - Confidence scoring
  - Error correction

### 2. Recommendation Engine
- *Algorithm*: Weighted scoring model
- *Factors*:
  - Price (40% weight)
  - Distance (40% weight) 
  - Availability (20% weight)
  - User preferences
- *Features*:
  - Emergency mode prioritization
  - Personalized recommendations
  - Real-time optimization

### 3. Substitute Engine
- *Matching Criteria*:
  - Salt composition (exact match)
  - Therapeutic class (similar treatment)
  - Dosage form (similar administration)
- *AI Features*:
  - Drug interaction checking
  - Safety rating calculation
  - Price-benefit analysis

## 🗺 Map Integration

### Features
- *Interactive Maps*: Leaflet.js with OpenStreetMap
- *Custom Markers*: 
  - Blue: User location
  - Green: Available pharmacies
  - Gold: Best recommendation
- *Popup Information*:
  - Pharmacy details
  - Medicine availability
  - Price information
  - Directions link

## 📊 Analytics & Insights

### Dashboard Metrics
- Total partner pharmacies
- Medicines tracked
- Average response time
- Success rate
- Popular medicine categories
- Usage trends
- System performance

### Charts & Visualizations
- Medicine category distribution (Pie Chart)
- Weekly usage trends (Bar Chart)
- Price trends over time (Line Chart)
- System performance metrics (Area Chart)

## 🔒 Security & Privacy

### Data Protection
- *Anonymization*: No personal data stored
- *Encryption*: HTTPS/TLS for all communications
- *Rate Limiting*: API abuse prevention
- *Input Validation*: XSS and injection protection
- *CORS*: Controlled cross-origin requests

### Privacy Features
- Location data not stored permanently
- Prescription images processed locally when possible
- Minimal data collection
- GDPR compliance ready

## 🛠 Technology Stack

### Frontend
- *React 18*: Modern UI framework
- *Material-UI*: Component library
- *React Router*: Navigation
- *Leaflet*: Interactive maps
- *Recharts*: Data visualization
- *Axios*: HTTP client
- *React Dropzone*: File uploads

### Backend
- *Node.js*: Runtime environment
- *Express.js*: Web framework
- *Multer*: File upload handling
- *Helmet*: Security middleware
- *CORS*: Cross-origin support
- *Rate Limiting*: API protection

### Development Tools
- *Concurrently*: Run multiple processes
- *Nodemon*: Auto-restart server
- *ESLint*: Code linting
- *Prettier*: Code formatting

## 🚀 Deployment

### Production Build
bash
# Build client
cd client && npm run build

# Start production server
npm start


### Environment Variables
bash
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com


### Docker Deployment (Optional)
dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN cd client && npm ci && npm run build
EXPOSE 5000
CMD ["npm", "start"]


## 🔮 Future Enhancements

### Planned Features
- *Voice Search*: Voice-to-text medicine search
- *Delivery Integration*: Partner with delivery services
- *Prescription Management*: Digital prescription storage
- *Medicine Reminders*: Dosage and refill alerts
- *Telemedicine Integration*: Connect with healthcare providers
- *Inventory Predictions*: AI-powered stock forecasting

### UiPath Integration
- *Automated Data Collection*: Pharmacy inventory updates
- *Price Monitoring*: Real-time price tracking
- *Alert System*: Stock shortage notifications
- *Report Generation*: Automated analytics reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@medai.com
- 📱 Phone: +1-555-MEDAI-HELP
- 💬 Chat: Available in the application

## 🙏 Acknowledgments

- OpenStreetMap for map data
- Material-UI for component library
- Tesseract.js for OCR capabilities
- React community for excellent documentation
- All contributors and testers

---

*MedAI* - Making healthcare accessible, affordable, and efficient through AI-powered technology.

Built with ❤ for better healthcare outcomes
