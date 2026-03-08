import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
	Brain,
	CodepenLogo,
	UsersThree,
	CaretDown,
	DotsNine,
	SignOut,
	GoogleLogo
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

	const menuRef = useRef(null);
	const menuToggleDesktopRef = useRef(null);
	const menuToggleMobileRef = useRef(null);
	const profileRef = useRef(null);
	const profileToggleRef = useRef(null);

	const { user, login, logout, isAuthenticated, loading } = useAuth();

	// ========================= GOOGLE LOGIN =========================

	const googleLogin = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			try {
				const backendResponse = await fetch('/api/auth/google', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ accessToken: tokenResponse.access_token })
				});

				if (!backendResponse.ok) {
					throw new Error('Backend authentication failed');
				}

				const userData = await backendResponse.json();
				login(userData);
			} catch (error) {
				console.error("Login failed:", error);
			}
		},
		onError: () => {
			console.error("Google login failed — check Client ID and authorized origins");
		}
	});

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

	const handleSignIn = () => {
		googleLogin();
	};

	const handleLogout = async () => {
		await logout();
		setIsProfileOpen(false);
	};

	// ========================= CLICK OUTSIDE =========================

	const isClickInsideRef = (ref, event) => {
		return ref.current && ref.current.contains(event.target);
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			// Close nav menu
			if (isMenuOpen) {
				const isInsideMenu = isClickInsideRef(menuRef, event);
				const isInsideDesktopToggle = isClickInsideRef(menuToggleDesktopRef, event);
				const isInsideMobileToggle = isClickInsideRef(menuToggleMobileRef, event);

				if (!isInsideMenu && !isInsideDesktopToggle && !isInsideMobileToggle) {
					closeMenu();
				}
			}

			// Close profile dropdown
			if (isProfileOpen) {
				const isInsideProfile = isClickInsideRef(profileRef, event);
				const isInsideProfileToggle = isClickInsideRef(profileToggleRef, event);

				if (!isInsideProfile && !isInsideProfileToggle) {
					setIsProfileOpen(false);
				}
			}
		};

		if (isMenuOpen || isProfileOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMenuOpen, isProfileOpen]);

	// ========================= RENDER =========================

	const renderAuthButton = () => {
		if (loading) {
			return null;
		}

		if (isAuthenticated) {
			return (
				<button
					className="sign-in-button"
					onClick={handleToggleProfile}
					ref={profileToggleRef}
				>
					<img
						src={user.picture}
						alt={user.name}
						className="sign-in-profile-picture"
						referrerPolicy="no-referrer"
					/>
					<span>{user.name}</span>
				</button>
			);
		}

		return (
			<button className="sign-in-button" onClick={handleSignIn}>
				<GoogleLogo size={18} weight="bold" />
				<span>Sign in</span>
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
						ref={menuToggleDesktopRef}
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
						ref={menuToggleMobileRef}
					>
						<DotsNine size={24} color="#fff" />
					</button>

					{/* Auth button / profile */}
					{renderAuthButton()}
				</div>
			</div>

			{/* Navigation dropdown — positioned under navbar */}
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

			{/* Profile dropdown — positioned under navbar */}
			{isProfileOpen && isAuthenticated && (
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
		</nav>
	);
}

export default Navbar;