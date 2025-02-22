import React from 'react';
import { Link } from 'react-router-dom';
import '../cascading_style_sheets/Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="home-header">
        {/* Larger SVG logo with updated styling */}
        <img src="/logo.svg" alt="Logo" className="home-logo" />
        {/* Main title with glowing effect */}
        <h1 className="glowing-text">KeybyKey</h1>
        {/* Updated subheader and caption */}
        <h2 className="subheader">A Memorization Tool</h2>
        <p className="caption">Try it out now:</p>
      </div>

      <div className="home-boxes">
        <Link 
          to="/memorize" 
          className="home-box" 
          style={{ backgroundImage: "url(/memorize_link_image.png)" }}
        >
          <span className="box-label">Memorize</span>
        </Link>

        <Link 
          to="/flashcard-categories" 
          className="home-box" 
          style={{ backgroundImage: "url(/flashcard_link_image.png)" }}
        >
          <span className="box-label">Flashcard Categories</span>
        </Link>

        <Link 
          to="/about-us" 
          className="home-box" 
          style={{ backgroundImage: "url(/aboutus_link_image.png)" }}
        >
          <span className="box-label">About Us</span>
        </Link>
      </div>

      {/* Extra spacing at the bottom */}
      <div className="home-footer-spacing"></div>
    </div>
  );
};

export default Home;