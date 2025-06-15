import React from 'react';
import SEO from '../../components/SEO/SEO';
import './LegalPages.css';

const TermsAndConditions = () => {
  return (
    <div className="legal-page">
      <SEO 
        title="Terms and Conditions"
        description="Terms and Conditions for EV Charging Network - Learn about the rules and guidelines for using our service."
        keywords="terms and conditions, terms of service, user agreement, EV charging"
      />
      
      <div className="container">
        <h1>Terms and Conditions</h1>
        <div className="last-updated">Last Updated: {new Date().toLocaleDateString()}</div>
        
        <section>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using EV Charging Network's services, you agree to be bound by these Terms and Conditions. 
            If you disagree with any part of these terms, you may not access our service.
          </p>
        </section>

        <section>
          <h2>2. Use of Service</h2>
          <h3>2.1 Eligibility</h3>
          <p>To use our service, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Have a valid driver's license</li>
            <li>Own or have access to an electric vehicle</li>
            <li>Have a valid payment method</li>
          </ul>

          <h3>2.2 Account Registration</h3>
          <p>When creating an account, you agree to:</p>
          <ul>
            <li>Provide accurate information</li>
            <li>Maintain the security of your account</li>
            <li>Notify us of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>

        <section>
          <h2>3. Booking and Payment</h2>
          <p>Our booking and payment terms include:</p>
          <ul>
            <li>Charging rates are subject to change</li>
            <li>Bookings are subject to availability</li>
            <li>Payment is processed at the time of booking</li>
            <li>Cancellation policies apply as per the station rules</li>
          </ul>
        </section>

        <section>
          <h2>4. User Responsibilities</h2>
          <p>As a user, you agree to:</p>
          <ul>
            <li>Use charging stations properly and safely</li>
            <li>Report any issues or damages</li>
            <li>Follow all posted rules and guidelines</li>
            <li>Not misuse or damage the equipment</li>
          </ul>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            EV Charging Network is not liable for any indirect, incidental, special, consequential, or punitive damages 
            resulting from your use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2>6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any material changes 
            via email or through our website.
          </p>
        </section>

        <section>
          <h2>7. Contact Information</h2>
          <p>
            For any questions about these Terms and Conditions, please contact us at:
            <br />
            Email: karanravirajput@gmail.com
            <br />
            Phone: +91 9309963483
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions; 