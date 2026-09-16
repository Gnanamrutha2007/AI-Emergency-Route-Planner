from django.db import models

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    icu_beds = models.IntegerField(default=10)
    status = models.CharField(max_length=50, default="Optimal")

    class Meta:
        app_label = 'backend'

    def __str__(self):
        return f"{self.name} ({self.icu_beds} beds)"


class EmergencyRequest(models.Model):
    patient_name = models.CharField(max_length=255)
    emergency_type = models.CharField(max_length=100)
    severity = models.IntegerField(default=1)
    location = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=50, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'backend'

    def __str__(self):
        return f"{self.patient_name} - {self.emergency_type}"