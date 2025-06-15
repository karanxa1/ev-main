import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import './Legal.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <SEO 
        title="Privacy Policy - EV Charging Network"
        description="Privacy policy for EV Charging Network. Learn how we collect, use, and protect your personal information."
        keywords="privacy policy, data protection, personal information, EV charging, privacy"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>EV Charging Network ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <ul>
              <li>Name and contact information</li>
              <li>Email address and phone number</li>
              <li>Vehicle information</li>
              <li>Payment details</li>
              <li>Location data</li>
            </ul>

            <h3>2.2 Usage Information</h3>
            <ul>
              <li>Charging history</li>
              <li>Booking preferences</li>
              <li>Device information</li>
              <li>IP address and browser type</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Process your bookings and payments</li>
              <li>Send you important updates and notifications</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section>
            <h2>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>Service providers and partners</li>
              <li>Payment processors</li>
              <li>Analytics providers</li>
              <li>Law enforcement when required</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>We implement appropriate security measures to protect your information, including:</p>
            <ul>
              <li>Encryption of sensitive data</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2>7. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Remember your preferences</li>
              <li>Analyze website usage</li>
              <li>Improve our services</li>
              <li>Provide personalized content</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>Our services are not intended for children under 18. We do not knowingly collect information from children under 18.</p>
          </section>

          <section>
            <h2>9. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.</p>
          </section>

          <section>
            <h2>10. Changes to Privacy Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of any material changes through our website or email.</p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>For privacy-related questions or concerns, please contact us at:</p>
            <ul>
              <li>Email: karanravirajput@gmail.com</li>
              <li>Phone: +91 9309963483</li>
              <li>Address: Pune, Maharashtra, India</li>
            </ul>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/terms" className="legal-link">Terms and Conditions</Link>
          <Link to="/" className="legal-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy; 