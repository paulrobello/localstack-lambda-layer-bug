FROM amazonlinux:latest

RUN yum install -y wget tar zip gzip bzip python3 python3-pip && \
    yum clean all

RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install virtualenv

RUN mkdir /app
WORKDIR /app
RUN python3 -m venv python37

COPY requirements.txt .
RUN source python37/bin/activate && pip3 install -r requirements.txt -t ./python
RUN zip -rq python.zip ./python/

COPY . ./
RUN zip -rq deploy.zip ./ -x "python*" -x ".*" -x "Dockerfile"
