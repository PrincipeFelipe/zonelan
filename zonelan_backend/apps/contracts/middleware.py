class DocumentFrameMiddleware:
    """
    Middleware para permitir que los documentos se muestren en iframes, 
    modificando X-Frame-Options para las rutas de documentos.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Comprobar si la ruta corresponde a documentos o archivos multimedia
        if (request.path.startswith('/mediafiles/') or 
            request.path.startswith('/media/') or 
            request.path.endswith('.pdf') or 
            request.path.endswith('.jpg') or 
            request.path.endswith('.png') or 
            request.path.endswith('.jpeg') or 
            '/documents/' in request.path):
            
            # Permitir que estos documentos se muestren en iframes del mismo origen
            response['X-Frame-Options'] = 'SAMEORIGIN'
            
            # Eliminar Content-Disposition si existe (para evitar descargas automáticas)
            if 'Content-Disposition' in response:
                del response['Content-Disposition']
        
        return response