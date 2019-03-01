#!/bin/bash

>&2 echo "--==== Integration Tests Runner ====--"

env_file=$1
if [ $# -ne 1 ]; then
  echo "Usage: $0 env-file"
  exit 1
fi

>&2 echo ""
>&2 echo "====== Loading environment variables ======"
cat $1
. $1
>&2 echo "==========================================="
>&2 echo ""
>&2 echo "Executing Integration Tests for $APP_HOST ..."

>&2 echo "Creating local directory to store test results"
mkdir -p $TEST_DIR/results

# Generic functions

stop_docker() {
  >&1 echo "$DB_HOST environment is shutting down"
  (docker stop $DB_HOST && docker rm $DB_HOST) > /dev/null 2>&1
  >&1 echo "$APP_HOST environment is shutting down"
  (docker stop $APP_HOST && docker rm $APP_HOST) > /dev/null 2>&1
  >&1 echo "Deleting test network: $DOCKER_NETWORK"
  docker network rm integration-test-net
}

clean_docker() {
  stop_docker
}

ftest() {
  docker run -it --rm \
    --network $DOCKER_NETWORK \
    --env HOST_IP="$APP_HOST" \
    --env MOPF_DATABASE_URI="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    --env TEST_DIR=$TEST_DIR \
    $DOCKER_IMAGE:$DOCKER_TAG \
    /bin/sh \
    -c "source $TEST_DIR/integration-runner.env; $@"
}

run_test_command() {
  >&2 echo "Running $APP_HOST Test command: $TEST_CMD"
  docker run -it \
    --link $DB_HOST \
    --network $DOCKER_NETWORK \
    --name $APP_HOST \
    --env HOST_IP="$APP_HOST" \
    --env MOPF_DATABASE_URI="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    --env TEST_DIR=$TEST_DIR \
    $DOCKER_IMAGE:$DOCKER_TAG \
    /bin/sh \
    -c "source $TEST_DIR/integration-runner.env; $TEST_CMD"
}

# DB functions

start_db() {
  docker run -td \
    -p $DB_PORT:$DB_PORT \
    --name $DB_HOST \
    --network $DOCKER_NETWORK \
    -e MYSQL_USER=$DB_USER \
    -e MYSQL_PASSWORD=$DB_PASSWORD \
    -e MYSQL_DATABASE=$DB_NAME \
    -e MYSQL_ALLOW_EMPTY_PASSWORD=true \
    $DB_IMAGE:$DB_TAG
}

fdb() {
  docker run -it --rm \
    --link $DB_HOST:mysql \
    --network $DOCKER_NETWORK \
    -e DB_HOST=$DB_HOST \
    -e DB_PORT=$DB_PORT \
    -e DB_PASSWORD=$DB_PASSWORD \
    -e DB_USER=$DB_USER \
    -e DB_NAME=$DB_NAME \
    mysql \
    sh -c \
    "$@"
}

is_db_up() {
  fdb 'mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "select 1"' > /dev/null 2>&1
}

# Script execution

>&1 echo "Building Docker Image $DOCKER_IMAGE:$DOCKER_TAG with $DOCKER_FILE"
docker build --no-cache -t $DOCKER_IMAGE:$DOCKER_TAG -f $DOCKER_FILE .

if [ "$?" != 0 ]
then
  >&2 echo "Build failed...exiting"
  clean_docker
  exit 1
fi

>&1 echo "Creating test network: $DOCKER_NETWORK"
docker network create $DOCKER_NETWORK

>&2 echo "DB is starting"
start_db

>&2 echo "Waiting for DB to start"
until is_db_up; do
  >&2 printf "."
  sleep 5
done

>&1 echo "Running migrations"
ftest "npm run migrate"

if [ "$?" != 0 ]
then
  >&2 echo "Migration failed...exiting"
  # clean_docker
  exit 1
fi

>&2 echo "Integration tests are starting"
set -o pipefail && run_test_command
test_exit_code=$?
>&2 echo "Test exited with result code.... $test_exit_code ..."

>&1 echo "Displaying test logs"
docker logs $APP_HOST

>&1 echo "Copy results to local directory"
docker cp $APP_HOST:$DOCKER_WORKING_DIR/$APP_DIR_TEST_RESULTS $TEST_DIR

if [ "$test_exit_code" == 0 ]
then
  >&1 echo "Showing results..."
  cat $APP_DIR_TEST_RESULTS/$TEST_RESULTS_FILE
else
  >&2 echo "Integration tests failed...exiting"
  >&2 echo "Test environment logs..."
  docker logs $APP_HOST
fi

stop_docker
>&1 echo "Integration tests exited with code: $test_exit_code"
exit "$test_exit_code"
