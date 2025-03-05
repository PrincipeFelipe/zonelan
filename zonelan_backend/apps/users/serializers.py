from rest_framework import serializers
from .models import User

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual no es correcta')
        return value

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'name', 'email', 'phone', 'cod_worker', 'type']
        extra_kwargs = {
            'password': {'write_only': True},
            'cod_worker': {'read_only': True},
            'username': {'required': False},
            'name': {'required': False},
            'email': {'required': False},
            'phone': {'required': False},
            'type': {'required': False}
        }

    def create(self, validated_data):
        if 'password' not in validated_data:
            raise serializers.ValidationError({'password': 'Este campo es requerido para crear un usuario'})
        
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        # Si solo se está actualizando la contraseña
        if list(validated_data.keys()) == ['password']:
            if validated_data.get('password'):
                instance.set_password(validated_data['password'])
                instance.save()
            return instance
            
        # Para otras actualizaciones
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance