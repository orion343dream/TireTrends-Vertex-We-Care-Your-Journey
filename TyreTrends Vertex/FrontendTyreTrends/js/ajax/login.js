$(document).ready(function () {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();

        $.ajax({
            url: 'http://localhost:8080/api/v1/auth/authenticate',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({email, password}),
            success: function (data) {
                if (data.code === 200) {
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('role', data.data.role);
                    localStorage.setItem('userEmail', data.data.email);

                    if (data.data.role === 'ADMIN') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } else {
                    $('#alertError').text(data.message || 'Login failed').addClass('show');
                }
            },
            error: function (xhr) {
                let errorMsg = 'An error occurred. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                $('#alertError').text(errorMsg).addClass('show');
            }
        });
    });
});