import React from "react";
import styles from "./Main.module.scss";
import TestComponent from "../../components/TestComponent/TestComponent.tsx";
import { useParams } from "react-router-dom";

type MainObject={

}

const Main = ():JSX.Element=>{
	const {id} = useParams();
	return(
		<div className={styles.Main}>
            Main
			<TestComponent opt1={1} opt2={"Hello!"}>
				<div>
					{id}
				</div>
				<div>
                    This thing2!
				</div>
				<div>
                    This thing3!
				</div>
			</TestComponent>
		</div>
	);
};

export default Main;