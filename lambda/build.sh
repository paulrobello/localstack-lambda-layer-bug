#!/bin/bash -e

#BASE_NAME="${PWD##*/}"
BASE_NAME=`basename $PWD`
LAYER_NAME="$BASE_NAME"_layer:latest
PROJECT_FOLDER=$(pwd)
echo BASE_NAME "$BASE_NAME"
echo LAYER_NAME "$LAYER_NAME"
echo PROJECT_FOLDER "$PROJECT_FOLDER"
export MSYS_NO_PATHCONV=1

docker build -f Dockerfile -t "$LAYER_NAME" .
#docker run -v "$PROJECT_FOLDER":/opt/mount \
#docker run --mount type=bind,src=$PROJECT_FOLDER,target=/opt/mount \
#--rm --entrypoint /bin/bash \
#"$LAYER_NAME" \
#-c "cp -v /app/*.zip /opt/mount/"

docker cp $(docker create --rm "$LAYER_NAME"):/app/deploy.zip ./deploy.zip
docker cp $(docker create --rm "$LAYER_NAME"):/app/python.zip ./python.zip


ls "$PROJECT_FOLDER"
