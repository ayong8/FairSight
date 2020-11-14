<h1 align="center">
	<img width="250" src="https://www.dropbox.com/s/7xo4w8ak9lkwrqy/fairsight-logo.png?raw=1" alt="FairSight">
	<br>
</h1>
<b>FairSight</b> is a viable fair decision making system to assist decision makers in achieving fair decision making through the machine learning workflow.

### Reference
Ahn, Y., & Lin, Y. R. (2019). <b>Fairsight: Visual analytics for fairness in decision making.</b> IEEE transactions on visualization and computer graphics (TVCG), 26(1), 1086-1095.

### Specification

- <b>React</b>: Frontend framework for rendering and communicating with data
- <b>django</b>: Python-based backend framework for serving API of data and running machine learning work
- <b>scss</b>: The stylesheet grammar for more flexible structure
- <b>d3.js</b>: Javascript-based visualization library

### FairDM

<h1 align="center">
	<img width="80%" src="https://www.dropbox.com/s/kkh3qk5iabp5o92/fairdm-teaser.png?raw=1" alt="FairSight">
	<br>
</h1>
<b>FairSight</b> is developed on top of <i>FairDM</i>, a general fair decision making framework. Our framework is a model-agnostic framework with its goal to provide a fairness pipeline to guide the examination of fairness at each step (from input to output) in the workflow.

### System

<h1 align="center">
	<img width="700" src="https://www.dropbox.com/s/kg0fo0jawm954q3/fairsight-system.png?raw=1" alt="FairSight">
	<br>
	<br>
</h1>
<b>(a) Generator</b>: The workflow of FairSight starts with setting up inputs including the sensitive attribute and protected group. <br>
<b>(b) Ranking View</b>: After running a model, the ranking outcome and measures are represented. <br>
<b>(c) Global Inspection View</b>: Visualizes the two spaces and the mapping process of Individual and Group fairness provided in the separate tap. <br>
<b>(d) Local Inspection View</b>: When an individual is hovered, Local Inspection
View provides the instance- and group-level exploration. <br>
<b>(e) Feature Inspection View</b>: Users can investigate the feature distortion and feature perturbation to identify features as the possible source of bias. <br>
<b>(f) Ranking List View</b>: All generated ranking outcomes are listed and plotted.
