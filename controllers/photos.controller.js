const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const sanitize = require('mongo-sanitize');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  const emailReg = /^((([0-9A-Za-z]{1}[-0-9A-z\.]{1,}[0-9A-Za-z]{1})|([0-9А-Яа-я]{1}[-0-9А-я\.]{1,}[0-9А-Яа-я]{1}))@([-A-Za-z]{1,}\.){1,2}[-A-Za-z]{2,})$/u; 
  
  try {
    const file = req.files.file;
    const title = sanitize(req.fields.title);
    const author = sanitize(req.fields.author);
    const email = sanitize(req.fields.email);

    if(title && author && email && file) { // if fields are not empty...
      if(author.length > 50) throw new Error('Author name is to long. Max length is 50 characters');
      if(!emailReg.test(email)) throw new Error('Wrong email!');

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      if(fileName.length > 25) throw new Error('File name is to long. Max length is 25 characters');

      const fileType = fileName.split('.').slice(-1)[0];
      
      if(fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong file type!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  const clientIp = requestIp.getClientIp(req); 
  const voter = await Voter.findOne({user: clientIp});
  
  try {
    if(!voter) {
      const newVoter = new Voter({user: clientIp, votes: [req.params.id]});
      newVoter.save();
    } else {
      const votes = voter.votes;
      
      if(voter.votes.includes(req.params.id)) {
        throw new Error('This foto is alredy voted');
      } else {
        voter.votes.push(req.params.id);
        voter.save();
      } 
    }

    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
