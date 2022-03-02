import { useState } from "react";
import React from "react";
import { getPropsWithDefaults } from "@uifabric/utilities";

// esse código utiliza a metodologia de componentes funcionais

const DropDown = (props) => {
/** "selected" here is state variable which will hold the
* value of currently selected dropdown.
*/

//state para controlar a abordagem escolhida
const [selected, setSelected] = useState("");
// criação de outro state para manipular o nome do algoritmo escolhido
const [selected2, setSelected2] = useState("")

/** Function that will set different values to state variable
* based on which dropdown is selected
*/
const changeSelectOptionHandler = (event) => {
	//
	setSelected(event.target.value);
	//serve para resetar o valor de selected2
	setSelected2("")
};

const showAlgorithm = (event) =>{
	setSelected2(event.target.value);
}
/** Different arrays for different dropdowns */
const partitioning= [
	"kmeans",
	"kmodes",
];
const hierarchical = ["hclust", "birch"];
const density = ["dbscan"];

/** Type variable to store different array for different dropdown */
let type = null;

/** This will be used to create set of options that user will see */
let options = null;

/** Setting Type variable according to dropdown */
if (selected === "Clusterização por Particionamento") {
	type = partitioning;
} else if (selected === "Clusterização Hierárquica") {
	type = hierarchical;
} else if (selected === "Clusterização por Densidade") {
	type = density;
}

/** If "Type" is null or undefined then options will be null,
* otherwise it will create a options iterable based on our array
*/
if (type) {
	options = type.map((el) => <option key={el}>{el}</option>);
}
return (
	<div
	style={{
		padding: "16px",
		margin: "16px",
		display: "flex",
		justifyContent: "center",
		flexDirection: "row",
		alignContent: "center",

	}}
	>
	<form>
		<div style={{backgroundColor: "#eee", padding:"20px", width:"300px",}}>
			<div>
			{/** Bind changeSelectOptionHandler to onChange method of select.
			* This method will trigger every time different
			* option is selected.
			*/}
			<select style={{padding:"10px", alignContent:"center", justifyContent:"center",}} onChange={changeSelectOptionHandler}>
				<option>Escolha a abordagem</option>
				<option>Clusterização por Particionamento</option>
				<option>Clusterização Hierárquica</option>
				<option>Clusterização por Densidade</option>
			</select>
			</div>
			<div style={{margin: "5px"}}>
			<select style={{padding:"10px", alignContent:"center", justifyContent:"center",}} onChange={showAlgorithm} /*onChange={showAlgorithm}*/>
				<option>Escolha o algoritmo</option>
				{
				/** This is where we have used our options variable */
				options
				}
			</select>
			<p style={{color:"#000",}}>Abordagem escolhida: {selected}</p>
			<p style={{color:"#000",}}>Algoritmo: {selected2} </p>
			</div>
		</div>
	</form>
	</div>
);
};

export default DropDown;