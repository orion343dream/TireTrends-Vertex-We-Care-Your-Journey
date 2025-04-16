// auth-service.js - Handles authentication related functionality

class AuthService {
    constructor() {
        this.tokenKey = 'token';
        this.roleKey = 'role';
        this.userProfileKey = 'userProfile';
    }

    // Login user
    login(email, password) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'http://localhost:8080/api/v1/auth/authenticate',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ email, password }),
                success: (data) => {
                    if (data.code === 200) {
                        // Store token and role
                        localStorage.setItem(this.tokenKey, data.data.token);
                        localStorage.setItem(this.roleKey, data.data.role);

                        // Fetch user profile after successful login
                        this.fetchUserProfile()
                            .then(() => resolve(data))
                            .catch(error => {
                                console.error('Error fetching user profile:', error);
                                resolve(data); // Still resolve with login data
                            });
                    } else {
                        reject(new Error(data.message || 'Login failed'));
                    }
                },
                error: (xhr) => {
                    let errorMsg = 'An error occurred. Please try again.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                    reject(new Error(errorMsg));
                }
            });
        });
    }

    // Logout user
    logout() {
        return new Promise((resolve, reject) => {
            const token = this.getToken();

            if (!token) {
                this.clearUserData();
                resolve();
                return;
            }

            $.ajax({
                url: 'http://localhost:8080/api/v1/auth/logout',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: () => {
                    this.clearUserData();
                    resolve();
                },
                error: (xhr) => {
                    // Even if server logout fails, clear local storage
                    this.clearUserData();
                    resolve();
                }
            });
        });
    }

    // Register user
    register(formData) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'http://localhost:8080/api/v1/user/register',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: (response) => {
                    resolve(response);
                },
                error: (xhr) => {
                    let errorMsg = 'An error occurred. Please try again.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                    reject(new Error(errorMsg));
                }
            });
        });
    }

    // Fetch user profile
    fetchUserProfile() {
        return new Promise((resolve, reject) => {
            const token = this.getToken();

            if (!token) {
                reject(new Error('No authentication token found'));
                return;
            }

            $.ajax({
                url: 'http://localhost:8080/api/v1/user/profile',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: (response) => {
                    if (response.code === 200) {
                        localStorage.setItem(this.userProfileKey, JSON.stringify(response.data));
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message || 'Failed to fetch user profile'));
                    }
                },
                error: (xhr) => {
                    let errorMsg = 'Failed to fetch user profile';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                    reject(new Error(errorMsg));
                }
            });
        });
    }

    // Get user profile
    getUserProfile() {
        const profileData = localStorage.getItem(this.userProfileKey);
        return profileData ? JSON.parse(profileData) : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.getToken();
    }

    // Check if user is admin
    isAdmin() {
        return this.getRole() === 'ADMIN';
    }

    // Get token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Get role
    getRole() {
        return localStorage.getItem(this.roleKey);
    }

    // Clear user data
    clearUserData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
        localStorage.removeItem(this.userProfileKey);
    }
}

// Create singleton instance
const authService = new AuthService();