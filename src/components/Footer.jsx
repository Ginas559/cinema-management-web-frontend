import { Link } from "react-router-dom";
import { 
  Mail, Phone, MapPin, Clock, 
  Facebook, Twitter, Instagram, Youtube,
  Film, Star, Calendar, Users, Settings, Shield
} from "lucide-react";
import cinema from "../assets/cinema.png";
import "../styles/footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="cinema-footer">
      <div className="footer-content">
        {/* About Section */}
        <div className="footer-section">
          <h3>About CinemUTE</h3>
          <div className="footer-links">
            <Link to="/about" className="footer-link">
              <Film className="footer-link-icon" />
              About Us
            </Link>
            <Link to="/careers" className="footer-link">
              <Users className="footer-link-icon" />
              Careers
            </Link>
            <Link to="/news" className="footer-link">
              <Star className="footer-link-icon" />
              News & Events
            </Link>
            <Link to="/partnerships" className="footer-link">
              <Settings className="footer-link-icon" />
              Partnerships
            </Link>
          </div>
        </div>

        {/* Services Section */}
        <div className="footer-section">
          <h3>Services</h3>
          <div className="footer-links">
            <Link to="/movie-tickets" className="footer-link">
              <Film className="footer-link-icon" />
              Movie Tickets
            </Link>
            <Link to="/group-bookings" className="footer-link">
              <Users className="footer-link-icon" />
              Group Bookings
            </Link>
            <Link to="/gift-cards" className="footer-link">
              <Star className="footer-link-icon" />
              Gift Cards
            </Link>
            <Link to="/private-screenings" className="footer-link">
              <Calendar className="footer-link-icon" />
              Private Screenings
            </Link>
          </div>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h3>Contact Info</h3>
          <div className="contact-info">
            <div className="contact-item">
              <MapPin className="contact-icon" />
              <span>123 Cinema Street, Ho Chi Minh City</span>
            </div>
            <div className="contact-item">
              <Phone className="contact-icon" />
              <span>+84 123 456 789</span>
            </div>
            <div className="contact-item">
              <Mail className="contact-icon" />
              <span>info@cinemute.vn</span>
            </div>
          </div>
          
          <div className="cinema-hours">
            <strong>Operating Hours:</strong>
            Mon - Thu: 10:00 AM - 10:00 PM<br />
            Fri - Sun: 10:00 AM - 11:00 PM
          </div>

          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">
              <Facebook className="social-icon" />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <Twitter className="social-icon" />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <Instagram className="social-icon" />
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <Youtube className="social-icon" />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-logo">
          <span className="logo-text">CinemUTE</span>
          <img src={cinema} alt="CinemUTE" className="logo-icon" />
        </div>
        
        <div className="footer-copyright">
          © {currentYear} CinemUTE. All rights reserved.
        </div>
        
        <div className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}