import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import './EarningsSummary.css';

const EarningsSummary = ({ chargers, bookings, totalEarnings }) => {
  // Calculate earnings by charger
  const earningsByCharger = chargers.map(charger => ({
    id: charger.id,
    name: charger.name,
    revenue: charger.revenue || 0,
    bookingsCount: bookings.filter(booking => booking.chargerId === charger.id).length
  }));

  // Calculate earnings by month (for the last 6 months)
  const getMonthlyData = () => {
    const now = new Date();
    const monthlyData = [];

    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      const year = month.getFullYear();
      
      // Filter bookings for this month
      const monthlyBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.getMonth() === month.getMonth() && 
               bookingDate.getFullYear() === month.getFullYear();
      });
      
      // Calculate total for the month
      const monthlyTotal = monthlyBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      
      monthlyData.unshift({
        month: `${monthName} ${year}`,
        earnings: monthlyTotal
      });
    }
    
    return monthlyData;
  };

  const monthlyData = getMonthlyData();
  const maxEarning = Math.max(...monthlyData.map(data => data.earnings), 0.01);

  return (
    <div className="earnings-summary">
      <div className="earnings-stats">
        <div className="stat-card">
          <h4>Total Earnings</h4>
          <p className="stat-value">{formatCurrency(totalEarnings)}</p>
        </div>
        <div className="stat-card">
          <h4>Total Bookings</h4>
          <p className="stat-value">{bookings.length}</p>
        </div>
        <div className="stat-card">
          <h4>Avg. Booking Value</h4>
          <p className="stat-value">
            {bookings.length ? formatCurrency(totalEarnings / bookings.length) : formatCurrency(0)}
          </p>
        </div>
      </div>

      <h3>Monthly Earnings</h3>
      <div className="chart-container">
        <div className="bar-chart">
          {monthlyData.map((data, index) => (
            <div key={index} className="chart-column">
              <div 
                className="bar" 
                style={{ height: `${(data.earnings / maxEarning) * 100}%` }}
              >
                {data.earnings > 0 && (
                  <span className="bar-value">{formatCurrency(data.earnings)}</span>
                )}
              </div>
              <span className="bar-label">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      <h3>Earnings by Charger</h3>
      <div className="earnings-table">
        <table>
          <thead>
            <tr>
              <th>Charger</th>
              <th>Bookings</th>
              <th>Earnings</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {earningsByCharger.map(charger => (
              <tr key={charger.id}>
                <td>{charger.name}</td>
                <td>{charger.bookingsCount}</td>
                <td>{formatCurrency(charger.revenue)}</td>
                <td>
                  {totalEarnings ? 
                    Math.round((charger.revenue / totalEarnings) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="withdraw-section">
        <h3>Withdraw Earnings</h3>
        <p>Current available balance: <strong>{formatCurrency(totalEarnings)}</strong></p>
        <button className="withdraw-button" disabled={totalEarnings <= 0}>
          Withdraw to Bank Account
        </button>
        <p className="withdraw-note">
          Withdrawals are processed within 2-3 business days via NEFT/IMPS
        </p>
        
        {/* Add Indian payment method options */}
        <div className="payment-options">
          <div className="payment-option">
            <span>UPI</span>
          </div>
          <div className="payment-option">
            <span>NEFT</span>
          </div>
          <div className="payment-option">
            <span>IMPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsSummary;
