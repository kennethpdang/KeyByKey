import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// On mount, check if there's an existing session.
	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch('/api/auth/me', {
					credentials: 'include'
				});

				if (response.ok) {
					const userData = await response.json();
					setUser(userData);
				}
			} catch (error) {
				console.error("Failed to check session:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	/**
	 * Stores the authenticated user data in state.
	 * Called by the Navbar after the backend confirms the login.
	 */
	const login = useCallback((userData) => {
		setUser(userData);
	}, []);

	/**
	 * Clears the session on the backend and removes user from state.
	 */
	const logout = useCallback(async () => {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});
		} catch (error) {
			console.error("Logout request failed:", error);
		} finally {
			setUser(null);
		}
	}, []);

	const value = {
		user,
		loading,
		login,
		logout,
		isAuthenticated: !!user
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
}