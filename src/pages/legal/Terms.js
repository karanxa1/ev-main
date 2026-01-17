import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import './Legal.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <SEO 
        title="Terms and Conditions - EV Charging Network"
        description="Terms and conditions for using EV Charging Network's services. Learn about our policies, user responsibilities, and service agreements."
        keywords="terms and conditions, EV charging, user agreement, service terms, legal"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Terms and Conditions</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>Welcome to EV Charging Network. These Terms and Conditions govern your use of our website and services. By accessing or using our services, you agree to be bound by these terms.</p>
          </section>

          <section>
            <h2>2. Definitions</h2>
            <ul>
              <li><strong>"Service"</strong> refers to the EV charging station network and related services.</li>
              <li><strong>"User"</strong> refers to any individual or entity using our services.</li>
              <li><strong>"Charging Station"</strong> refers to any EV charging point in our network.</li>
              <li><strong>"Booking"</strong> refers to the reservation of a charging station.</li>
            </ul>
          </section>

          <section>
            <h2>3. Account Registration</h2>
            <p>To use our services, you must:</p>
            <ul>
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2>4. Service Usage</h2>
            <h3>4.1 Charging Station Access</h3>
            <ul>
              <li>Users must follow all posted instructions at charging stations</li>
              <li>Users are responsible for their vehicle's compatibility</li>
              <li>Users must not damage or tamper with equipment</li>
            </ul>

            <h3>4.2 Booking and Cancellation</h3>
            <ul>
              <li>Bookings can be made through our website or mobile app</li>
              <li>Cancellations must be made at least 30 minutes before the booking time</li>
              <li>Late cancellations may result in charges</li>
            </ul>
          </section>

          <section>
            <h2>5. Payment Terms</h2>
            <ul>
              <li>All prices are in Indian Rupees (INR)</li>
              <li>Payment is processed at the time of booking</li>
              <li>Refunds are processed within 5-7 business days</li>
              <li>We reserve the right to change pricing with notice</li>
            </ul>
          </section>

          <section>
            <h2>6. User Responsibilities</h2>
            <ul>
              <li>Maintain valid payment information</li>
              <li>Report any issues with charging stations</li>
              <li>Follow safety guidelines</li>
              <li>Respect other users' time and space</li>
            </ul>
          </section>

          <section>
            <h2>7. Prohibited Activities</h2>
            <p>Users must not:</p>
            <ul>
              <li>Use the service for illegal purposes</li>
              <li>Attempt to bypass security measures</li>
              <li>Share account credentials</li>
              <li>Interfere with other users' access</li>
              <li>Damage or vandalize equipment</li>
            </ul>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <p>All content, logos, and materials on our platform are protected by intellectual property rights. Users may not use, copy, or distribute our content without permission.</p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>EV Charging Network is not liable for:</p>
            <ul>
              <li>Indirect or consequential damages</li>
              <li>Service interruptions</li>
              <li>Data loss or security breaches</li>
              <li>Third-party actions</li>
            </ul>
          </section>

          <section>
            <h2>10. Changes to Terms</h2>
            <p>We may modify these terms at any time. Users will be notified of significant changes. Continued use of the service constitutes acceptance of modified terms.</p>
          </section>

          <section>
            <h2>11. Contact Information</h2>
            <p>For questions about these terms, please contact us at:</p>
            <ul>
              <li>Email: karanravirajput@gmail.com</li>
              <li>Phone: +91 9309963483</li>
              <li>Address: Pune, Maharashtra, India</li>
            </ul>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/privacy" className="legal-link">Privacy Policy</Link>
          <Link to="/" className="legal-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Terms; 