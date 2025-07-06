import os
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Standard security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Determine environment
        is_dev = os.environ.get('DJANGO_ENV') == 'development'

        # CSP sources
        connect_sources = [
            "'self'",
            "http://127.0.0.1:8000"
        ] if is_dev else [
            "'self'",
            settings.PRODUCTION_API_URL
        ]

        csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https:",
            "style-src 'self' 'unsafe-inline' https:",
            "img-src 'self' data: https:",
            f"connect-src {' '.join(connect_sources)}",
            "frame-ancestors 'none'",
            "form-action 'self'"
        ]
        response['Content-Security-Policy'] = "; ".join(csp)

        # Feature Policy
        response['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"

        return response
