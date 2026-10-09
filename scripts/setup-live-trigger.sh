#!/bin/bash
# One-time: connect is done in the console if this trigger create asks for GitHub.
set -euo pipefail
PROJECT=gen-lang-client-0549025293
REGION=europe-west1
gcloud config set project "$PROJECT"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com --project "$PROJECT"
NUM=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
CB="${NUM}@cloudbuild.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:${CB}" --role="roles/run.admin" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:${CB}" --role="roles/artifactregistry.writer" >/dev/null
RUN_SA=$(gcloud run services describe naje-ai --region="$REGION" --project="$PROJECT" --format='value(spec.template.spec.serviceAccountName)')
if [ -z "$RUN_SA" ]; then
  RUN_SA="${NUM}-compute@developer.gserviceaccount.com"
fi
gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" --member="serviceAccount:${CB}" --role="roles/iam.serviceAccountUser" --project "$PROJECT" >/dev/null
gcloud artifacts repositories describe naje --location="$REGION" --project="$PROJECT" >/dev/null 2>&1 || \
  gcloud artifacts repositories create naje --repository-format=docker --location="$REGION" --project="$PROJECT"
gcloud builds triggers create github \
  --name="naje-live" \
  --repo-name="naje-qv" \
  --repo-owner="mahmudnaje-del" \
  --branch-pattern="^live$" \
  --build-config="cloudbuild.yaml" \
  --region="$REGION" \
  --project="$PROJECT"
echo "Trigger naje-live is on branch live."
