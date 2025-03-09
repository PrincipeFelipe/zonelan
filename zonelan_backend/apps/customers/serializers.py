from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'business_name', 'tax_id', 'address', 'email', 'phone', 'contact_person']