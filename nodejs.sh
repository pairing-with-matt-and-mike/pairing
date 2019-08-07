#!/bin/bash

NODE_TAR=$(curl https://nodejs.org/dist/latest/SHASUMS256.txt | grep "\-linux-x64.tar.xz" | cut -d' ' -f3)
NODE_DIR=$(basename $NODE_TAR .tar.xz)
UNTAR_DIR=$(readlink -e ~)
cd $UNTAR_DIR
wget https://nodejs.org/dist/latest/$NODE_TAR
tar -xJf $NODE_TAR
sudo ln -s $UNTAR_DIR/$NODE_DIR/bin/node /usr/local/bin/node
sudo ln -s $UNTAR_DIR/$NODE_DIR/bin/npm  /usr/local/bin/npm
sudo ln -s $UNTAR_DIR/$NODE_DIR/bin/npx  /usr/local/bin/npx

npm install -g prettier
sudo ln -s $UNTAR_DIR/$NODE_DIR/bin/prettier  /usr/local/bin/prettier
