import React from 'react';

function Header() {
  return (
    <header className="app-header">
      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="app-logo" />
    </header>
  );
}

export default Header;