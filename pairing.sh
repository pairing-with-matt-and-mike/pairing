#!/bin/bash

# https://aws.amazon.com/ec2/pricing/on-demand/
# m5.xlarge

function add-user {
    USERNAME=$1
    GH_USERNAME=$2
    sudo adduser --disabled-password --gecos "" $USERNAME
    wget https://github.com/$GH_USERNAME.keys
    sudo mkdir /home/$USERNAME/.ssh/
    sudo mv $GH_USERNAME.keys /home/$USERNAME/.ssh/authorized_keys
    sudo chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh
    sudo chmod 600 /home/$USERNAME/.ssh/authorized_keys
}

add-user matt thatismatt
add-user mike mwilliamson
add-user lauri liwp

sudo apt -y update
sudo apt -y install emacs-nox
