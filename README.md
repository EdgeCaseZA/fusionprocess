Fusion XML Processor CLI
========================

Can do something with the XML received from the [fusiontest](https://github.com/EdgeCaseZA/fusiontest) CLI

The `processor.js` file has sample processing for getting the XML character count `processor.size`, getting the commitToken `processor.extractToken` and downloading the first X number of images `processor.downloadImages`.

### Dependencies

- Node >=5.0.0

### Installation

    git clone https://github.com/EdgeCaseZA/fusionprocess.git
    cd fusionprocess
    npm install
    npm link

### Usage

    fusiontest [options] > sample.xml
    cat sample.xml | fusionprocess

OR

    fusiontest [options] | fusionprocess
