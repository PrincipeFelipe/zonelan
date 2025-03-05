from rest_framework import serializers
from .models import Incident

class IncidentSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    reported_by_name = serializers.ReadOnlyField(source='reported_by.username')
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')

    class Meta:
        model = Incident
        fields = '__all__'