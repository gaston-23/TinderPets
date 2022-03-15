require("dotenv").config();

import User from "../models/user";
import Pet from "../models/pet";

import auth from "../passport";

import passport from "passport";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

class PetsController {
  /**
   * Obtener mascota mediante id
   * @return {json}
   */
  static async getPet(req, res, next) {
    passport.authenticate("jwt", { session: false }, async (err, payload) => {
      if (payload == false)
        return res.status(401).send({ message: "Sin autorización" });

      try {
        let pet = await Pet.findById(req.params.id);
        console.log(pet);
        return res.status(200).json(pet);

      } catch (error) {
        console.error(error.message, "getPet");
        return res.status(400).json({
          message: "Error al obtener mascota",
        });
      }
    })(req, res);
  }

  /**
   * Obtener todas las mascotas mediante id de usuario
   * @return {json}
   */
   static async getAllPets(req, res, next) {
    passport.authenticate("jwt", { session: false }, async (err, payload) => {
      if (payload == false)
        return res.status(401).send({ message: "Sin autorización" });

      try {
        return Pet.find({owner: req.params.id} , (error, person)=> {
          if (error) {
            throw error
          } else {
            if(person){
              console.log(person);
              return res.status(200).json(person)
            }else{
              console.error(error.message, "getPet");
              return res.status(400).json({
                message: "Error al obtener mascota",
              });
            }
          }
        });
      } catch (error) {
        console.error(error.message, "getPet");
        return res.status(400).json({
          message: "Error al obtener mascota",
        });
      }
    })(req, res);
  }

  /**
   * Actualizar usuario
   * @param req.body.update datos a actualizar de la mascota
   * @param req.body.id id de la mascota
   * @return {json}
   */
  static async updatePet(req, res) {
    passport.authenticate("jwt", { session: false }, async (err, payload) => {
      if (payload == false)
        return res.status(401).send({ message: "Sin autorización" }); //añadir que no se puedan modificar otras mascotas

      const newInfo = req.body;
      console.log(req.body);
      try {
        await Pet.findByIdAndUpdate(req.params.id, newInfo, {
          returnDocument: "after",
        })
          .then((updated) => {
            return res.status(200).json(updated);
          })
          .catch((error) => {
            // error al actualizar
            return res.status(400).json({
              message: `Error al actualizar información de mascota (#${req.params.id})`,
            });
          });
      } catch (error) {
        // error al actualizar
        console.error(error.message, "updatePet");
        return res.status(400).json({
          message: error,
        });
      }
    })(req, res);
  }

  /**
   * Creacion de mascota
   * @return {json}
   */
  static async createPet(req, res, next) {
    passport.authenticate("jwt", { session: false }, async (err, payload) => {
      if (payload == false)
        return res.status(401).send({ message: "Sin autorización" });

      console.log(req.body);

      let pet = new Pet();

      pet.name = req.body.name;
      pet.age = req.body.age;
      pet.img = req.body.img;
      pet.kind = req.body.kind;
      pet.subkind = req.body.subkind;
      pet.tags = req.body.tags;
      console.log(req.body);

      pet
        .save()
        .then((petStored) => {
          console.log(petStored);
          if (!petStored) {
            return res.status(404).send({
              message: "Error al registrar la mascota",
            });
          } else {
            User.findByIdAndUpdate(
              { _id: payload.user._id },
              { $addToSet: { pets: petStored._id } }
            )
              .then((updated) => {
                return res.status(200).send({
                  user: updated,
                  newPet: petStored,
                });
              })
              .catch((error) => {
                // error al actualizar
                return res.status(400).json({
                  message: `Error al asignar la mascota al usuario (#${payload.user._id})`,
                });
              });
          }
        })
        .catch((error) => {
          console.log(error);
          return res.status(400).send({
            message: "Error al guardar mascota",
          });
        });
    })(req, res);
  }

  /**
   * Obtener todas las mascotas mediante id de usuario
   * @return {json}
   */
   static async removePets(req, res, next) {
    passport.authenticate("jwt", { session: false }, async (err, payload) => {
      if (payload == false)
        return res.status(401).send({ message: "Sin autorización" });

    await Pet.findByIdAndDelete(req.params.id)
        .then( response => {
          if(response){
            console.log(response);
            return res.status(200).json(response)
          }else{
            console.error(error.message, "getPet");
            return res.status(400).json({
              message: "Error al obtener mascota",
            });
          }
        })
        .catch( error => {
          console.error(error.message, "deletePet");
          return res.status(400).json({
            message: "Error al obtener mascota",
          });
        })
    })(req, res);
  }
}

export default PetsController;