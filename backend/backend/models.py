from django.db import models

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    icu_beds = models.IntegerField(default=10)
    status = models.CharField(max_length=50, default="Optimal")

    class Meta:
        app_label = 'backend'  # Forces Django to recognize this model under the backend app

    def __str__(self):
        return f"{self.name} ({self.icu_beds} beds)"