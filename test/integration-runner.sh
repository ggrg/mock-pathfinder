#!/bin/bash

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

# DB functions

start_db() {
  docker run -td \
    -p $DB_PORT:$DB_PORT \
    --name $DB_HOST \
    -e MYSQL_USER=$DB_USER \
    -e MYSQL_PASSWORD=$DB_PASSWORD \
    -e MYSQL_DATABASE=$DB_NAME \
    -e MYSQL_ALLOW_EMPTY_PASSWORD=true \
    $DB_IMAGE:$DB_TAG
}

fdb() {
  docker run -it --rm \
    --link $DB_HOST:mysql \
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

stop_docker() {
  (docker stop $DB_HOST && docker rm $DB_HOST) > /dev/null 2>&1
}

run_test_command()
{
  eval "$TEST_CMD"
}

>&2 echo "Loading environment variables"
source $env_file

>&2 echo "Mysql is starting"
start_db

>&2 echo "Waiting for DB to start"
until is_db_up; do
  >&2 printf "."
  sleep 5
done

>&2 echo 
>&2 echo "Creating integration database"
fdb 'mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME;"' > /dev/null 2>&1

export MOPF_DATABASE_URI="mysql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

>&2 echo "Running migrations"
npm run migrate > /dev/null 2>&1

>&2 echo "Integration tests are starting"
set -o pipefail && run_test_command
test_exit_code=$?
>&2 echo "Test exited with result code.... $test_exit_code ..."

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
