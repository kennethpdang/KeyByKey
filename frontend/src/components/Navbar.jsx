import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
	Brain,
	CodepenLogo,
	UsersThree,
	CaretDown,
	DotsNine,
	SignOut
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import '../cascading_style_sheets/Navbar.css';

const menuItems = [
	{ to: "/memorize", label: "Memorize", icon: Brain },
	{ to: "/flashcard-categories", label: "Categories", icon: CodepenLogo },
	{ to: "/about-us", label: "About Us", icon: UsersThree }
];

function Navbar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [showGoogleLogin, setShowGoogleLogin] = useState(false);

	const menuRef = useRef(null);
	const menuToggleRef = useRef(null);
	const profileRef = useRef(null);
	const profileToggleRef = useRef(null);

	const { user, login, logout, isAuthenticated, loading } = useAuth();

	// ========================= MENU TOGGLE =========================

	const handleToggleMenu = () => {
		setIsMenuOpen((previous) => !previous);
		setIsProfileOpen(false);
	};

	const closeMenu = () => {
		setIsMenuOpen(false);
	};

	// ========================= PROFILE TOGGLE =========================

	const handleToggleProfile = () => {
		setIsProfileOpen((previous) => !previous);
		setIsMenuOpen(false);
	};

	const handleLoginClick = () => {
		setShowGoogleLogin(true);
	};

	const handleGoogleSuccess = async (credentialResponse) => {
		try {
			await login(credentialResponse);
			setShowGoogleLogin(false);
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	const handleGoogleError = () => {
		console.error("Google login failed");
		setShowGoogleLogin(false);
	};

	const handleLogout = async () => {
		await logout();
		setIsProfileOpen(false);
	};

	// ========================= CLICK OUTSIDE =========================

	useEffect(() => {
		const handleClickOutside = (event) => {
			// Close nav menu
			if (
				isMenuOpen &&
				menuRef.current &&
				!menuRef.current.contains(event.target) &&
				menuToggleRef.current &&
				!menuToggleRef.current.contains(event.target)
			) {
				closeMenu();
			}

			// Close profile dropdown
			if (
				isProfileOpen &&
				profileRef.current &&
				!profileRef.current.contains(event.target) &&
				profileToggleRef.current &&
				!profileToggleRef.current.contains(event.target)
			) {
				setIsProfileOpen(false);
			}

			// Close Google login popup if clicking outside
			if (showGoogleLogin) {
				setShowGoogleLogin(false);
			}
		};

		if (isMenuOpen || isProfileOpen || showGoogleLogin) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMenuOpen, isProfileOpen, showGoogleLogin]);

	// ========================= RENDER =========================

	const renderAuthButton = () => {
		if (loading) {
			return null;
		}

		if (isAuthenticated) {
			return (
				<div className="profile-wrapper">
					<button
						className="profile-button"
						onClick={handleToggleProfile}
						ref={profileToggleRef}
					>
						<img
							src={user.picture}
							alt={user.name}
							className="profile-picture"
							referrerPolicy="no-referrer"
						/>
						<CaretDown
							size={12}
							weight="bold"
							className={`profile-caret ${isProfileOpen ? "rotated" : ""}`}
						/>
					</button>

					{isProfileOpen && (
						<div className="profile-dropdown" ref={profileRef}>
							<div className="profile-info">
								<img
									src={user.picture}
									alt={user.name}
									className="profile-dropdown-picture"
									referrerPolicy="no-referrer"
								/>
								<div className="profile-details">
									<span className="profile-name">{user.name}</span>
									<span className="profile-email">{user.email}</span>
								</div>
							</div>
							<div className="profile-divider"></div>
							<button className="profile-menu-item" onClick={handleLogout}>
								<SignOut size={18} />
								<span>Sign out</span>
							</button>
						</div>
					)}
				</div>
			);
		}

		if (showGoogleLogin) {
			return (
				<div className="google-login-wrapper">
					<GoogleLogin
						onSuccess={handleGoogleSuccess}
						onError={handleGoogleError}
						size="medium"
						theme="filled_black"
						shape="pill"
					/>
				</div>
			);
		}

		return (
			<button className="sign-in-button" onClick={handleLoginClick}>
				Sign in
			</button>
		);
	};

	return (
		<nav className="navbar">
			<div className="navbar-content">
				<div className="navbar-brand">
					<Link to="/">
						<img src="/logo.svg" alt="Logo" className="logo" />
					</Link>
				</div>

				<div className="navbar-actions">
					{/* Navigation menu toggle — Desktop */}
					<button
						className="navbar-toggle navbar-toggle-desktop"
						onClick={handleToggleMenu}
						ref={menuToggleRef}
					>
						<span className="menu-label">Menu</span>
						<CaretDown
							size={14}
							weight="bold"
							className={`menu-caret ${isMenuOpen ? "rotated" : ""}`}
						/>
					</button>

					{/* Navigation menu toggle — Mobile */}
					<button
						className="navbar-toggle navbar-toggle-mobile"
						onClick={handleToggleMenu}
						ref={menuToggleRef}
					>
						<DotsNine size={24} color="#fff" />
					</button>

					{/* Auth button / profile */}
					{renderAuthButton()}
				</div>
			</div>

			{/* Navigation dropdown */}
			{isMenuOpen && (
				<div className="navbar-menu" ref={menuRef}>
					{menuItems.map(({ to, label, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="navbar-menu-item"
							onClick={closeMenu}
						>
							<Icon size={20} className="menu-item-icon" />
							<div className="menu-item-text">
								<span className="menu-item-label">{label}</span>
							</div>
						</Link>
					))}
				</div>
			)}
		</nav>
	);
}

export default Navbar;