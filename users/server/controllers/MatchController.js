require('dotenv').config();

import Pet from '../models/pet';
import Like from '../models/like';
import Match from '../models/match';
import User from '../models/user';


import passport from 'passport';

import moment from 'moment';



class MatchController {

    /**
	 * Obtener sugerencias de match de acuerdo con la raza y subraza
	 * @return {json}
	 */
	 static async getSuggestion(req, res) {
		passport.authenticate('jwt', { session: false }, async (err, payload) => {
			if (!payload ) return res.status(401).send({ message: 'Sin autorización' });
			
			try {
				let pets = await Pet.find( {kind: req.body.kind} );
				console.log("body",req.body);
				console.log(pets);
				pets = pets.map(el => {
					let w = 0;
					w += el.subkind == req.body.subkind ? 20 : 0;
					w -= Math.abs(el.age - req.body.age) ;
					// el.tags.forEach(element => {
					// 	w += req.body.tags.some(element)? 3 : 0;
					// });
					el.w = w;
					if (el._id != req.body._id) {
						return el;
					}
				}).sort(function (a, b) {
					if (a.w > b.w) {
					  return 1;
					}
					if (a.w < b.w) {
					  return -1;
					}
					// a must be equal to b
					return 0;
				  });
				console.log(pets);
				return res.status(200).json(pets);
			}
			catch (error) {
				console.error(error.message, 'getSuggestion');
				return res.status(400).json({
					message: 'Error al obtener mascotas',
				});
			}
		})(req, res);
	}

	/**
	 * Like usuario
	 * @return {json}
	 */
	static async setLike(req, res) {
	  passport.authenticate('jwt', { session: false }, async (err, payload) => {
		console.log(payload)
		if (!payload) return res.status(401).send({ message: 'Sin autorización' });

	    console.log("body_completo",req.body);
		let like = new Like();
		if(req.body.like){
			like.user	= req.body.user;
			like.pet	= req.body.pet;
			like.time	= moment();
			like.owner	= payload.user._id;
			
			console.log("like",like);
			await like.save()
			.then(saved => {
				let matched = Like.find( //no probado
					{ owner: req.body.user },
					{ user: payload.user._id }
				  )
					.then((found) => {
						console.log('like asignado ',found);
						if (MatchController.setMatch(req.body.user,payload.user._id,req.body.pet,req.body.petOwn)) return true
						else{
							console.log('Error en matcheo');
							return false
						}
					})
					.catch((error) => {
					  console.log('error en busquda',error);
					});
				//verificar si tiene un like y devolver match
				
				return res.status(200).json({match: matched, liked: saved})
			})
			.catch( error => {
				// error al actualizar
				return res.status(400).json({
					message: `Error al actualizar información de usuario (#${ payload.user._id})`
				});
			});
		}else{
			let dislike = {
				user	: req.body.user,
				pet		: req.body.pet,
				owner	: payload.user._id
			}
			await like.findAndDelete(dislike)
			.then(saved => {
				return res.status(200).json(saved)
			})
			.catch( error => {
				// error al actualizar
				console.log('puto el que lee');
				return res.status(400).json({
					message: `Error al actualizar información de usuario (#${ payload.user._id})`
				});
			});
		}
	    
	  })(req, res);
	}

	/**
	 * Like usuario
	 * @return {json}
	 */
	 static async setMatch(user1, user2,pet,petOwn) {
		  
		let match1 = new Match();
		match1.user = user2;
		match1.time = moment.now();
		match1.owner = user1;
		match1.pet = petOwn;
		match1.pet_matched = pet;

		console.log("match1",match1);

		let flag1 = await match1.save()
			.then( saved => {
				console.log("saved",saved);
				return User.findByIdAndUpdate( //no probado
					  { _id: user1 },
					  { $addToSet: { matchs: saved._id } }
					)
					  .then((updated) => {
						  console.log('match asignado ',updated);
						  return true;
					  })
					  .catch((error) => {
						console.log(error);
						return false;
					  });
			})

		let match2 = new Match();
		match2.user = user1;
		match2.time = moment.now();
		match2.owner = user2;
		match2.pet = pet;
		match2.pet_matched = petOwn;

		let flag2 = await match2.save()
			.then( saved => {
				return User.findByIdAndUpdate( //no probado
					{ _id: user2 },
					{ $addToSet: { matchs: saved._id } }
				)
					.then((updated) => {
						console.log('match asignado ',updated);
						return true
					})
					.catch((error) => {
						console.log(error);
						return false
					});
			})
		return flag1 && flag2;
	  }

	/**
	 * Obtener los match del usuario
	 * @return {json}
	 */
	 static async getMatches(req, res) {
		passport.authenticate('jwt', { session: false }, async (err, payload) => {
			if (!payload) return res.status(401).send({ message: 'Sin autorización' });
			
			try {
				let matches = await Match.find( {owner: payload.user._id} ).populate('user').populate('pet_matched');
				
				console.log(matches);
				return res.status(200).json(matches);
			}
			catch (error) {
				console.error(error.message, 'getMatches');
				return res.status(400).json({
					message: 'Error al obtener matches',
				});
			}
		})(req, res);
	}

	

}

export default MatchController;