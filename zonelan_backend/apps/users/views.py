from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.hashers import check_password
from .models import User
from .serializers import UserSerializer, ChangePasswordSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Permite acceso sin autenticación a las acciones 'create' y 'list',
        pero requiere autenticación para el resto.
        """
        if self.action in ['create', 'list']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(self.request.data['password'])
        user.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        current_password = self.request.data.get('current_password')
        new_password = self.request.data.get('password')

        if new_password:
            if not current_password:
                raise ValidationError({'detail': 'Se requiere la contraseña actual'})
            
            if not check_password(current_password, instance.password):
                raise ValidationError({'detail': 'La contraseña actual es incorrecta'})

        instance.update(**serializer.validated_data)

    @action(detail=True, methods=['put'])
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'status': 'contraseña actualizada'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)