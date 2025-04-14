import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import './PaymentOptions.css';

const PaymentOptions = ({ amount, onPaymentComplete }) => {
  const [selectedMethod, setSelectedMethod] = useState('');

  const handlePaymentMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const processPayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      onPaymentComplete({ success: true, method: selectedMethod });
    }, 1500);
  };

  return (
    <div className="payment-container">
      <h3>Payment Options</h3>
      <p className="payment-amount">Amount: {formatCurrency(amount)}</p>
      
      <div className="payment-methods">
        <div 
          className={`payment-method ${selectedMethod === 'upi' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodSelect('upi')}
        >
          <div className="method-icon upi-icon"></div>
          <div className="method-name">UPI</div>
          <div className="method-description">Pay using any UPI app</div>
        </div>
        
        <div 
          className={`payment-method ${selectedMethod === 'card' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodSelect('card')}
        >
          <div className="method-icon card-icon"></div>
          <div className="method-name">Credit/Debit Card</div>
          <div className="method-description">Pay using any bank card</div>
        </div>
        
        <div 
          className={`payment-method ${selectedMethod === 'netbanking' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodSelect('netbanking')}
        >
          <div className="method-icon netbanking-icon"></div>
          <div className="method-name">Net Banking</div>
          <div className="method-description">Pay using internet banking</div>
        </div>
      </div>
      
      {selectedMethod === 'upi' && (
        <div className="upi-options">
          <div className="upi-popular">
            <div className="upi-app">Google Pay</div>
            <div className="upi-app">PhonePe</div>
            <div className="upi-app">Paytm</div>
            <div className="upi-app">Amazon Pay</div>
          </div>
          <div className="upi-input-container">
            <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" />
          </div>
        </div>
      )}
      
      <button 
        className="pay-button" 
        disabled={!selectedMethod}
        onClick={processPayment}
      >
        Pay Now
      </button>
      
      <div className="payment-security">
        <p>🔒 Secure Payment | Powered by RazorPay</p>
      </div>
    </div>
  );
};

export default PaymentOptions;
